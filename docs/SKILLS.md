# Skills Manifest — Deeter Intelligence

Every Claude Code skill evaluated for this project. Used skills map to exact build phases.

---

## USED SKILLS

| Skill | Phase | What It Did |
|---|---|---|
| `last30days` | 0: Research | Researched AI trading patterns, validated LLM Council and JARVIS architecture |
| `shadcn-ui` | 1: Scaffold | Initialized shadcn/ui with dark theme, installed all UI components |
| `nextjs` | 1: Scaffold | Next.js 16 App Router patterns, file conventions, async params |
| `ai-sdk` | 1-7: AI layer | AI SDK v7 patterns — `generateText + Output.object`, `useChat + DefaultChatTransport` |
| `ai-gateway` | 1: AI client | Gateway string routing — `"anthropic/claude-sonnet-4.6"` instead of direct providers |
| `next-cache-components` | 1: Config | `cacheComponents: true` for PPR, `'use cache'` directive patterns |
| `turbopack` | 1: Config | Turbopack as default bundler in Next.js 16, config migration from experimental |
| `next-upgrade` | 1: Config | Next.js 16 breaking changes — proxy.ts instead of middleware.ts |
| `vercel-functions` | 6-12: API | Route handler patterns, Fluid Compute, streaming, `after()` for background tasks |
| `react-best-practices` | 4-13: Components | Functional setState, no inline components, refs for transient values, avoiding waterfalls |
| `env-vars` | 1: Setup | `.env.local.example` structure, `vercel env pull` workflow, OIDC token lifecycle |
| `gstack` | Throughout | QA and verification at each phase end |
| `llm-council` | 7: Signals | Multi-model consensus scoring for borderline articles |
| `graphify` | 8: Entity graph | Entity knowledge graph for ticker/executive/event relationship traversal |
| `humanizer-skill` | 13: JARVIS | Strip AI writing patterns from voice responses |
| `ui-ux-pro-max` | 2: Design | Bloomberg terminal layout design system |
| `stitch-design` | 2: Components | Component-level design for each panel |
| `taste-skill` | 2 + 19: Polish | Dark terminal aesthetic gate |
| `frontend-design` | 3: Theme | Trading color tokens, real-time data display patterns |
| `mattpocock-skills:tdd` | 5-9: Logic | TypeScript-first logic for signal scoring, vector store, portfolio |
| `motion-animations` | 14: Animations | Article arrival, regime transitions, sentiment pulses |
| `gsap` | 14: JARVIS | Waveform visualizer, price tick flash |
| `emilkowalski-skill` | 14: Review | Animation quality gate |
| `mattpocock-skills:grilling` | 17: Arch review | Surface edge cases in the full system |
| `impeccable` | 18: Polish | Final code quality pass |
| `hyperframes` | 20: Demo | Loom walkthrough storyboard |
| `remotion` | 20: Demo video | Architecture explainer video |
| `banana-claude` | 20: Assets | README banner / GitHub social preview |
| `marketing-skills:copywriting` | 21: README | README prose and submission email |
| `superpowers:verification-before-completion` | Every phase | Verify each phase is actually done |
| `claude-mem:learn-codebase` | 1: Post-scaffold | Index codebase into memory |

---

## DISCARDED SKILLS

| Skill | Reason |
|---|---|
| `autoresearch` | Karpathy ML training tool — not applicable |
| `composio-skills` | Skills collection doc, not invokable |
| `gsd-pi` | Orchestration meta-framework for its own workflow system |
| `ais-os` | Personal AI OS kit, out of scope |
| `open-generative-ai` | Image/video generation studio |
| `youtube-agent` | YouTube automation, not relevant |
| `obsidian-mind` | Note-taking integration |
| `seedance-skill` | AI dance video generation |
| `higgsfield-skill` | AI video generation |
| `llm-council-karpathy` | No SKILL.md, duplicate of llm-council |
| `understand-anything` | No SKILL.md found |
| `chat-sdk` | Multi-platform chat bot SDK (Slack, Teams, etc.) — not relevant to trading terminal |
