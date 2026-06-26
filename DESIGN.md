# Deeter Intelligence — Design System

Bloomberg Terminal aesthetic. Always dark. Monospace only. Color carries signal meaning.

## Style Prompt

Dark professional trading terminal. Dense information hierarchy with precise spacing. Monospace Fira Code for all text — prices, labels, prose, everything. Color is semantic: green = bull/primary, red = bear/risk, amber = neutral/caution. No gradients, no blur, no decoration. Every element earns its place.

## Colors

| Role | Token |
|------|-------|
| Background | `oklch(0.07 0 0)` |
| Surface | `oklch(0.10 0 0)` |
| Text | `oklch(0.88 0.01 200)` |
| Muted text | `oklch(0.50 0.01 200)` |
| Bull green (primary) | `oklch(0.60 0.17 142)` |
| Bear red | `oklch(0.58 0.22 25)` |
| Amber (accent/neutral) | `oklch(0.78 0.18 85)` |
| Council purple | `oklch(0.55 0.15 280)` |
| Data blue | `oklch(0.55 0.12 220)` |
| Border | `oklch(1 0 0 / 9%)` |

## Typography

- **Fira Code** — all text, all weights (400/500/600/700)
- No sans-serif, no serif, no display fonts
- Letter-spacing: 0.18em on large titles, 0.2-0.28em on section labels, tight on body

## Motion

- Primary entrance ease: `power3.out`
- Snappy entrance ease: `expo.out`
- Ambient/pulse ease: `sine.inOut`
- Data entrances: slide from source direction (left = data in, right = interface out)
- No bounce, no elastic, no spring
- Durations: 0.5-0.7s entrances, 0.35-0.45s small elements, 0.9s ambient pulse cycle

## What NOT to Do

1. No `border-left` or `border-right` as accent stripes — use background tints only
2. No gradient text (`background-clip: text`)
3. No glassmorphism or `backdrop-filter`
4. No light background surfaces, no light mode
5. No sans-serif or serif fonts — Fira Code only
6. No animation `repeat: -1` — calculate finite repeats
7. No decorative borders > 1px
