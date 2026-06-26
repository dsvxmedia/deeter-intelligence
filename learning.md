# Deeter Intelligence — Hard-Won Lessons

Everything that burned time, broke unexpectedly, or required multiple attempts. Read before touching anything in these categories.

---

## Web Speech API / Browser Audio

### Chrome user activation — what counts and what doesn't

Chrome requires a "transient user activation" to call `speechSynthesis.speak()`. These events grant activation:

| Event | Grants activation? |
|---|---|
| `click` | ✓ Yes |
| `mousedown` | ✓ Yes |
| `pointerdown` | ✓ Yes |
| `touchstart` | ✓ Yes |
| `touchend` | ✓ Yes |
| `keydown` | ✓ Yes |
| `mousemove` | ✗ NO — learned the hard way |
| `setTimeout` callback | ✗ NO |
| `voiceschanged` callback | ✗ NO |
| Any async callback | ✗ NO |

**Rule:** If `speak()` is not called in the synchronous call stack originating from one of the ✓ events above, Chrome silently drops it. No error, no warning, nothing plays.

### `cancel()` before `speak()` is a silent killer

There is a confirmed Chrome bug where calling `speechSynthesis.cancel()` immediately followed by `speechSynthesis.speak()` causes the `speak()` to be silently ignored. The utterance is queued but never plays.

```ts
// BROKEN — cancel+speak in the same tick silently drops the utterance
window.speechSynthesis.cancel();
window.speechSynthesis.speak(utt); // Chrome ignores this

// FIXED — only cancel when you actually need to interrupt something
// For first speech (greeting): don't cancel at all
window.speechSynthesis.speak(utt);
```

### `getVoices()` returns empty on first call

`speechSynthesis.getVoices()` returns `[]` on the first call. Voices load asynchronously and fire a `voiceschanged` event. Naive implementation:

```ts
// BROKEN — voiceschanged is async, user activation is gone by the time it fires
if (synth.getVoices().length === 0) {
  synth.addEventListener("voiceschanged", () => synth.speak(utt), { once: true });
}
```

```ts
// FIXED — speak synchronously regardless of whether preferred voices loaded
// Use whatever voices are available NOW (system default is fine)
const voices = synth.getVoices();
const preferred = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google"));
if (preferred) utt.voice = preferred;
synth.speak(utt); // Always synchronous — don't wait for voiceschanged
```

### Chrome speechSynthesis stuck in paused state

Chrome sometimes puts speechSynthesis into a paused state where `speak()` queues utterances but nothing plays. Fix: call `resume()` before speaking.

```ts
window.speechSynthesis.resume(); // Unstick before speaking
window.speechSynthesis.speak(utt);
```

### Async wrappers and user activation

If you wrap `speak()` in an `async` function, user activation still survives IF the actual `synth.speak(utt)` call happens synchronously in the Promise executor (before any `await`). But this is fragile — one extra `await` anywhere in the chain breaks it. The safest approach for user-triggered speech:

```ts
// FRAGILE — async wrapper, easy to accidentally break
async function speak() {
  await browserSpeak(text); // Promise executor runs sync, so this MIGHT work
}

// BULLETPROOF — inline, nothing between user gesture and synth.speak()
const fire = () => {
  const synth = window.speechSynthesis;
  synth.resume();
  const utt = new SpeechSynthesisUtterance(text);
  utt.onend = () => setState("idle");
  utt.onerror = () => setState("idle");
  synth.speak(utt); // Direct, synchronous, no wrappers
};
```

**Rule:** For speech triggered by user gestures (especially one-shot greetings), bypass async wrappers entirely. Inline `synth.speak()` directly in the event handler.

### `window.addEventListener` is not a trusted user activation source in Next.js

Even when calling `speechSynthesis.speak()` from inside a `window.addEventListener("click", ...)` handler in a Next.js app, Chrome returns `not-allowed`. The exact error:

```
SpeechSynthesisErrorEvent { error: "not-allowed" }
pending: false  // utterance was rejected before even queueing
```

Root cause: React's event delegation intercepts events at the root container, and `window` listeners sit outside that system. Chrome's user activation tracking doesn't always bridge the gap in Next.js dev mode.

**Fix: use React synthetic events instead.**

Move the `speechSynthesis.speak()` call into a React `onPointerDown` or `onClick` prop on a component. React synthetic events are always trusted by Chrome.

```tsx
// BROKEN — window listener not trusted by Chrome in Next.js
window.addEventListener("click", () => window.speechSynthesis.speak(utt));

// FIXED — React synthetic event on the page root
<div onPointerDown={() => window.speechSynthesis.speak(utt)}>
```

For one-shot greetings, put the logic directly in the page's root div `onPointerDown`, guarded by a `useRef` to prevent double-fire.

### Debugging speechSynthesis failures

When speech silently fails, open DevTools → Console and listen for `SpeechSynthesisErrorEvent`. The `error` property tells you exactly why:

| Error name | Cause |
|---|---|
| `not-allowed` | No user activation — wrong event type or too late |
| `interrupted` | `cancel()` was called mid-utterance |
| `canceled` | `cancel()` before `speak()` race condition |
| `synthesis-unavailable` | Browser doesn't support TTS |

---

## HyperFrames Compositions

### Standalone vs sub-composition structure

Standalone `index.html` compositions do NOT use `<template>` wrapper. `<template>` hides content from the browser and breaks rendering.

```html
<!-- WRONG — template hides content from browser -->
<template id="my-comp-template">
  <div data-composition-id="arch" data-width="1920" data-height="1080">...</div>
</template>

<!-- CORRECT — div directly in body for standalone files -->
<body>
  <div data-composition-id="arch" data-width="1920" data-height="1080">...</div>
</body>
```

### Composition filename must be `index.html`

The hyperframes CLI (`npx hyperframes lint`, `npx hyperframes snapshot`) looks for `index.html`. Any other name (e.g. `architecture.html`) will not be found.

### Google Fonts imports cause lint errors

The hyperframes compiler auto-resolves a list of supported fonts (including JetBrains Mono, Fira Code, Inter, etc.). Adding a `<link>` to Google Fonts triggers two lint errors: `google_fonts_import` and `font_family_without_font_face`.

```html
<!-- WRONG — causes lint errors in hyperframes -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono" rel="stylesheet">

<!-- CORRECT — just use the font-family in CSS, compiler handles embedding -->
<style>
  * { font-family: "JetBrains Mono", monospace; }
</style>
```

For browser preview only, you can conditionally add the link:
```html
<script>
  if (!window.__hyperframes) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(link);
  }
</script>
```

### CSS selector scoping

Scoping styles to a composition with attribute selectors triggers `composition_self_attribute_selector` lint warnings.

```css
/* WARNS — attribute selector on composition root */
[data-composition-id="arch"] .my-element { color: red; }

/* CORRECT — add an id to the root div and use it */
#arch .my-element { color: red; }
```

```html
<div id="arch" data-composition-id="arch" ...>
```

### Timeline must be paused, browser preview must manually play

```js
// Required for hyperframes capture engine
const tl = gsap.timeline({ paused: true });
window.__timelines["arch"] = tl;

// Conditionally play for browser preview
if (!window.__hyperframes) { tl.play(); }
```

### `tl.set()` at t=0 vs `gsap.set()` outside timeline

`gsap.set()` called outside the timeline runs immediately when the page loads — it doesn't respect the timeline's position. Use `tl.set()` at `0` to initialize element state as the first keyframe.

```js
// WRONG — gsap.set runs immediately, ignores timeline
gsap.set(".element", { opacity: 0 });

// CORRECT — part of the timeline, respects playhead position
tl.set(".element", { opacity: 0 }, 0);
```

### `repeat: -1` breaks the capture engine

The hyperframes render engine cannot capture infinite loops. Calculate exact repeat counts from composition duration.

```js
// WRONG — capture engine hangs
gsap.to(".pulse", { scale: 1.05, repeat: -1, yoyo: true });

// CORRECT — finite repeats calculated from duration
const cycleDuration = 1.8;
const compositionDuration = 34;
gsap.to(".pulse", { scale: 1.05, repeat: Math.ceil(compositionDuration / cycleDuration), yoyo: true });
```

### OKLCH contrast false positives

The `hyperframes validate` WCAG contrast checker samples pixel colors. OKLCH colors at the edges of the gamut can produce false positives (e.g., `1.01:1` ratio on elements that are clearly readable). Visual verification via `npx hyperframes snapshot --at N` is the ground truth.

### Attribute vs data attribute for clip elements

`data-layer` and `data-end` are not valid hyperframes attributes. Use `data-track-index` and `data-duration`.

---

## React / Next.js

### React Strict Mode double-invokes effects

In development, React 18 Strict Mode intentionally mounts → unmounts → remounts every component. `useState` resets on cleanup, but `useRef` values persist across the cycle.

```tsx
// useRef persists across Strict Mode double-mount
const greetingFired = useRef(false);

useEffect(() => {
  if (greetingFired.current) return; // Still false after cleanup — correct

  const fire = () => {
    if (greetingFired.current) return;
    greetingFired.current = true; // Persists — greeting only fires once
    // ...
  };

  window.addEventListener("click", fire, { once: true });
  return () => window.removeEventListener("click", fire);
}, []);
```

### `"use client"` on lib files is valid

Marking a lib file with `"use client"` (e.g., `src/lib/tts.ts`) tells Next.js it can only run in the browser. Valid and correct for anything that touches `window`, `document`, or Web APIs.

### Hot reload doesn't always swap React hooks cleanly

After changing a `useEffect` or `useRef` in a client component, sometimes the browser still runs the old version. Use Cmd+Shift+R (hard refresh) to clear the module cache and start fresh.

---

## Vercel AI SDK

### `generateObject` removed in AI SDK v7

`generateObject` was removed. Use `streamObject` for streaming or `generateText` with a JSON schema prompt for one-shot structured output.

---

## General

### Always read DESIGN.md before writing UI or animation code

The project design system (`DESIGN.md`) defines exact OKLCH color tokens, typography rules (JetBrains Mono only), motion defaults, and a hard anti-pattern list. Skipping this step produces work that has to be redone.

### Skills go first, then implementation

The project has a full skill routing table in `CLAUDE.md`. Every category of work has a skill assigned to it. Invoking the right skill before implementation prevents wasted passes and keeps output consistent with previous phases.
