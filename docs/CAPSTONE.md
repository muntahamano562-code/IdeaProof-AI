# IdeaProof AI — Capstone Portfolio Entry

> Challenge your idea before you build it.

This document is the structured capstone submission for IdeaProof AI. All sections below are grounded in the actual repository at `https://github.com/muntahamano562-code/IdeaProof-AI.git`. Evidence that could not be produced from the repo is marked with a placeholder.

---

## Project Brief

Founders and solo builders frequently commit to an idea before testing its assumptions. IdeaProof AI solves this by running every submitted startup/product idea through a rigorous, skeptical pressure-test powered by Gemini AI — surfacing problem analysis, target audience fit, feasibility, competition, assumptions, risks, category scores, an overall score, confidence, an MVP recommendation, validation experiments, and a final **BUILD / PIVOT / DON'T BUILD** verdict. It is built for founders, indie hackers, product managers, and students who want an honest second opinion before spending time or money. This idea was chosen because idea validation is a high-frequency, high-value problem that maps cleanly onto a structured LLM workflow, and because forcing structured JSON output makes the AI's reasoning auditable rather than a black box.

## Live Application

**https://idea-proof-4drnzmoba-my-work8.vercel.app** — deployed on Vercel. The deployed URL is not yet recorded in this repository; add it here after the first successful deploy (do not invent it).

## Repository

`https://github.com/muntahamano562-code/IdeaProof-AI.git`

## Tech Stack

- React 18 + Vite 5 (JavaScript)
- Tailwind CSS (design tokens)
- React Router 6 (lazy route splitting)
- Zod (shared validation)
- Recharts (analysis charts)
- Gemini API (`generativelanguage.googleapis.com`) — server-side only
- Vercel Serverless Functions (`api/`)
- Vitest + Testing Library (unit/component)
- Playwright (E2E)

## Architecture

- **React frontend (Vite):** SPA; `src/App.jsx` lazy-loads routes to keep the initial bundle small.
- **Client services (`src/services/`):** `fetch` wrappers to `/api/*` that re-validate responses with the same Zod schemas used server-side.
- **API / serverless functions (`api/`):** each endpoint has a thin entry (`analyze.js`) delegating to a `*Core.js` handler containing prompt, input validation, rate limiting, Gemini call, and response validation.
- **Gemini integration:** only inside `api/*Core.js`; key read from `process.env`, never the browser bundle.
- **Zod schemas (`src/schemas/`):** single source of truth for analysis / challenge / experiment / history shapes, shared by client and server.
- **Vercel deployment:** `vercel.json` defines build command, output dir (`dist`), and SPA rewrite.
- **Testing:** Vitest (`vite.config.js`) + Playwright (`playwright.config.js`).

## AI Integration

- **Why Gemini:** fast and cost-effective, with native JSON `responseMimeType` and structured `responseSchema` support for validated output.
- **Where called:** only from server-side `api/*Core.js` modules.
- **Why the key stays server-side:** `GEMINI_API_KEY` is read in `api/` from `process.env`; exposing it client-side would allow scraping/abuse. The browser receives only the validated JSON.
- **System prompt role:** `analyzeCore.js` `SYSTEM_PROMPT` forces ONLY valid JSON matching the exact schema, demands skepticism, and forbids inventing statistics or research.
- **Passing the user idea:** `buildPrompt()` sends `title`, `description`, `targetUsers`, `problem` as the `user` content part.
- **Structured JSON request:** `generationConfig.responseMimeType = 'application/json'` (plus `responseSchema` for challenge/experiments).
- **Response validation:** raw text parsed by `extractJson()` (markdown-fence aware), then validated with `AnalysisSchema.safeParse()`; failure → controlled `502`.
- **Error handling:** missing key → `500`; provider/non-JSON/invalid JSON → `502`; proxy 400/401/403/404/429 mapped; 60s timeout → `504`.
- **Rate limiting / input limits:** `validateInput()` enforces length caps (title ≤ 5000, description ≤ 20000, etc.); `checkRateLimit()` allows 20 req/min per process.

## Setup & Run

```bash
npm install
cp .env.example .env      # then set GEMINI_API_KEY=...  (and optional GEMINI_MODEL)
npm run dev               # http://localhost:5173
npm run build             # production build → dist/
```

Prerequisites: Node 18+, a Gemini API key from Google AI Studio. Server env vars (never `VITE_`-prefixed): `GEMINI_API_KEY`, `GEMINI_MODEL`. Supabase vars are optional (later phases).

## Testing Evidence

- **Command:** `npm run test` → **74 tests across 13 files, all passing.**
- **Components tested (unit):** Zod schemas, client AI service (`analysis.test.js`), AnalysisDashboard, ReportView, HistoryList, NewIdeaPage, IdeaDetailPage, history/experiment stores, report markdown, datetime util.
- **E2E:** `src/test/e2e/analysis.spec.js` (Playwright) covers the critical flow new idea → analysis → saved → report, asserting the AI is not re-called on restore.
- **Coverage:** `npm run test:coverage` reports ~31.8% statement coverage. The capstone requirement (≥1 component unit test **or** E2E critical flow) is satisfied by both. UI pages requiring auth/Supabase remain uncovered.


## Performance & Accessibility

**Lighthouse (FE-10 final):** Performance 99 · Accessibility 95 · FCP 1.7s · LCP 1.7s · TBT 10ms · CLS 0 · Speed Index 2.4s
**WAVE (FE-10 final):** Errors 0 · Contrast Errors 0 · Alerts 0 · Features 5 · Structure 2 · ARIA 10 · AIM Score 10/10

Verified in-code improvements:
- Semantic `<main>` landmarks (`AppShell.jsx`, `LandingPage.jsx`, `AuthLayout.jsx`).
- `aria-live="polite"` for streamed/async AI output (`IdeaDetailPage.jsx`, `ChallengeMode.jsx`, `ValidationPlan.jsx`, `Toast.jsx`).
- Keyboard accessibility + ARIA labels on icon controls, modal focus handling (`Modal.jsx`), and Playwright keyboard E2E.
- CSS contrast tokens (`text-text-primary/secondary` on `background`/`elevated`).
- Performance via route-level `React.lazy` code splitting and small gzip chunks.

> Lighthouse/WAVE figures are the documented FE-10 assignment results; no new audit was run for this capstone.


## Deployment & Operation

Vercel checklist:
- [ ] `npm run build` passes
- [ ] `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`) set in Vercel env (server-side)
- [ ] Production URL verified
- [ ] Endpoints verified: `POST /api/analyze`, `/api/challenge`, `/api/experiments`
- [ ] Error states verified (400/405/429/500/502/504)
- [ ] Rate limiting present
- [ ] Secrets not exposed to client
- [ ] Rollback: redeploy last known-good commit from `main` via Vercel

> No monitoring/alerting is configured (future improvement).

## Known Limitations

- Assessment quality depends entirely on the founder-supplied text.
- No guaranteed real-world market research; scores reflect reasoning on supplied input, not live data.
- Depends on Gemini availability/quota (controlled errors, but no analysis when down).
- In-process rate limiting is per-instance, not distributed.
- Idea history is currently `localStorage`-only (no cross-device sync).

## Future Improvements

- Supabase auth + persistent, cross-device history.
- Optional, clearly-labeled research/data integrations.
- Distributed rate limiting (e.g. Vercel KV).
- User feedback loop to refine prompts from invalidated assumptions.

## Reflection

The hardest part was making the Gemini integration deterministic enough to trust in production. Early responses wrapped JSON in markdown fences or added commentary, which broke the strict Zod validation. Solving it required both a precise `SYSTEM_PROMPT` and a resilient `extractJson()` (direct parse → fenced fallback → brace-slice fallback) before validation — plus `responseMimeType: 'application/json'` so the model was steered toward clean output.

If I did it again, I would have added `@vitest/coverage-v8` from day one. Coverage was not wired up until this capstone, so I could not see the thin spots (auth/Supabase UI, several pages) until late. I also learned that keeping the validation schema shared between client and server (`src/schemas/`) is the single most valuable pattern here: it means a malformed AI payload is caught twice and never reaches the UI.

The most surprising lesson was about deployment, not AI: the `.env.example` documented `LLM_API_KEY` while the code actually reads `GEMINI_API_KEY`, so a fresh clone would silently fail to analyze. Fixing that mismatch (and confirming the key is never `VITE_`-prefixed) mattered more for a working deploy than any model tuning. Testing the accessibility paths with Playwright also caught that streamed AI output needed `aria-live` regions so screen-reader users are announced updates without a page reload.
