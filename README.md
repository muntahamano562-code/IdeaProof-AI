# IdeaProof AI

> Challenge your idea before you build it.

IdeaProof AI is an AI-powered startup and product idea validation platform. A user enters a business, startup, app, or product idea and the system pressure-tests it with **Gemini AI**, producing a structured assessment (problem analysis, target audience, feasibility, competition, assumptions, risks, category scores, overall score, confidence, MVP recommendation, validation experiments, and a **BUILD / PIVOT / DON'T BUILD** verdict).

---

## Project brief

Founders and solo builders often fall in love with an idea before testing the underlying assumptions. IdeaProof AI solves that by giving every submitted idea a rigorous, skeptical, evidence-based pressure-test instead of generic encouragement. It is built for founders, indie hackers, product managers, and students who want an honest second opinion before investing time or money. This idea was chosen because idea validation is a high-value, repeatable problem that maps cleanly onto a structured LLM workflow — and because the structured JSON output makes the reasoning auditable rather than a black box.

## Live application

Deployed on Vercel. Production URL: **[PRODUCTION_URL]** (set after first deploy; not yet recorded in this repo).

## Repository

`https://github.com/muntahamano562-code/IdeaProof-AI.git`

---

## Tech stack

- **React 18 + Vite 5** (JavaScript)
- **Tailwind CSS** (design tokens via `tailwind.config.js`)
- **React Router 6** (route-level code splitting)
- **Zod** (schema validation on server and client)
- **Recharts** (analysis dashboard visuals)
- **Gemini API** (`generativelanguage.googleapis.com`) — server-side only
- **Vercel Serverless Functions** (`api/`)
- **Vitest + Testing Library** (unit/component tests)
- **Playwright** (E2E tests)

## Project structure

```
ideaproof-ai/
├── api/                     # Vercel serverless functions (server-side only)
│   ├── analyze.js           # entry → analyzeCore.js
│   ├── analyzeCore.js       # Gemini analysis handler + schema validation
│   ├── challenge.js         # entry → challengeCore.js
│   ├── challengeCore.js     # skeptical challenge + evaluation handler
│   ├── experiments.js       # entry → experimentsCore.js
│   └── experimentsCore.js   # validation-plan handler
├── src/
│   ├── components/          # reusable UI (ui/, analysis/, auth/, layout/)
│   ├── features/            # feature modules
│   │   ├── analysis/        # AnalysisDashboard (charts)
│   │   ├── auth/            # AuthProvider, ProtectedRoute, AuthLayout
│   │   ├── challenge/       # ChallengeMode flow
│   │   ├── history/         # local history persistence
│   │   ├── ideas/           # idea drafts + experiment store
│   │   ├── reports/         # ReportView + markdown export
│   │   └── validation/      # ValidationPlan UI
│   ├── hooks/               # useAuth
│   ├── layouts/             # AppShell (authenticated layout)
│   ├── lib/                 # utilities (cn, datetime)
│   ├── pages/               # route-level pages
│   ├── schemas/             # Zod schemas (analysis/challenge/experiment/history)
│   ├── services/           # client-side API clients (fetch wrappers)
│   ├── styles/              # global styles
│   └── test/                # vitest setup, fixtures, e2e
├── docs/                    # documentation (capstone portfolio entry, etc.)
├── public/                  # static assets
├── .env.example             # environment template
├── vercel.json              # Vercel build/output config + SPA rewrite
├── vite.config.js           # Vite + Vitest config
├── playwright.config.js     # Playwright E2E config
└── README.md
```

---

## AI integration

- **Why Gemini:** fast, cost-effective, supports JSON `responseMimeType` and structured `responseSchema` so we can request validated JSON directly.
- **Where it is called:** only from server-side code in `api/` (never from the browser bundle).
- **Why the key stays server-side:** `GEMINI_API_KEY` is read from `process.env` inside `api/*.js`; if it were exposed to the client it could be scraped and abused. The browser only ever receives the validated structured object.
- **System prompt:** `analyzeCore.js` defines a strict `SYSTEM_PROMPT` that instructs Gemini to return ONLY valid JSON matching the exact schema, to stay skeptical, and never to invent statistics or research.
- **Passing the user idea:** the user's `title`, `description`, `targetUsers`, and `problem` are assembled by `buildPrompt()` and sent as the `user` content part.
- **Requesting structured JSON:** `generationConfig.responseMimeType = 'application/json'` (and `responseSchema` for challenge/experiments endpoints) forces Gemini to return parseable JSON.
- **Validating the response:** the raw text is parsed in `extractJson()` (with markdown-fence fallbacks), then validated by `AnalysisSchema.safeParse()` (`src/schemas/analysis.schema.js`). If validation fails, a controlled `502` is returned.
- **Error handling:** missing key → `500`; provider error / non-JSON / invalid JSON → `502`; proxy 400/401/403/404/429 mapped appropriately; timeout (`AbortController`, 60s) → `504`.
- **Rate limiting / input limits:** `validateInput()` enforces minimum lengths and hard caps (title ≤ 5000, description ≤ 20000, etc.), and `checkRateLimit()` allows 20 requests/minute per process to protect the endpoint.

## Setup & run

### Prerequisites

- Node.js 18+ and npm
- A Gemini API key from Google AI Studio

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your server-side Gemini key:

```bash
cp .env.example .env
```

`.env` (server-only values — never commit this file):

```ini
# Used by api/*.js
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.6-flash
```

> Supabase auth/persistence values (`VITE_SUPABASE_*`, `SUPABASE_*`) are optional and only needed for later phases. The core AI validation flow works without them.

### 3. Run locally

```bash
npm run dev
```

Then open the local URL printed by Vite (default `http://localhost:5173`).

### 4. Production build

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

Deploy `dist/` to Vercel (auto-detected via `vercel.json`).

---

## Architecture overview

- **React frontend (Vite):** SPA with route-level lazy loading (`App.jsx`) to keep the initial bundle small.
- **Client services (`src/services/`):** thin `fetch` wrappers to `/api/*` that re-validate responses with the same Zod schemas used on the server, so malformed data never reaches the UI.
- **API / serverless functions (`api/`):** each endpoint has a 3-line entry file (`analyze.js`) that delegates to a `*Core.js` module containing the handler, prompt, validation, rate limiting, and Gemini call. This keeps the server logic framework-agnostic and unit-testable.
- **Gemini integration:** only inside `*Core.js`; key from `process.env`, never the bundle.
- **Zod schemas (`src/schemas/`):** single source of truth for the analysis / challenge / experiment / history shapes, shared by client and server.
- **Vercel deployment:** `vercel.json` sets the build command, output directory (`dist`), and an SPA rewrite so client routes resolve.
- **Testing:** Vitest (unit/component) + Playwright (E2E). `vite.config.js` and `playwright.config.js` define both.

---

## Known limitations

- **Founder-supplied information:** the assessment quality depends entirely on the idea, target users, and problem text the founder provides. Thin input yields thin analysis.
- **No guaranteed real-world research:** Gemini is instructed not to invent statistics, so scores reflect reasoning on the supplied text, not live market data.
- **Gemini availability/quota dependency:** if the Gemini API is down or over quota, analysis returns a controlled error (the app fails safely but cannot analyze).
- **Lightweight in-process rate limiting:** the limiter is per serverless instance, not global, so it protects a single function but is not a distributed throttle.
- **Local-only history (current):** idea history is stored in `localStorage` via `historyStore.js`; there is no cross-device sync yet.

## Future improvements

- **Authentication + persistent history:** wire up Supabase (`src/services/supabase.js`) so users keep ideas across devices.
- **Richer research/data integrations:** optionally enrich analysis with search or market data (clearly labeled as such).
- **Distributed rate limiting:** move limits to a shared store (e.g. Vercel KV) for accurate throttling.
- **Feedback loop:** let users mark which assumptions were invalidated, improving future prompts.

---

## Testing evidence

Run the unit/component suite:

```bash
npm run test          # 74 tests across 13 files — all passing
npm run test:coverage # requires @vitest/coverage-v8 (installed as devDependency)
```

- **Unit/component tests** cover: Zod schemas (analysis, challenge, experiment, history), the client AI service (`src/services/analysis.test.js`), analysis dashboard, report view, history list, idea detail/new pages, history + experiment stores, and markdown export.
- **E2E tests** (`src/test/e2e/analysis.spec.js`, Playwright) cover the critical flow: new idea → AI analysis → saved to history → full report, asserting the AI is not re-called on restore.
- **Coverage:** statement coverage is ~31.8% overall (per `npm run test:coverage`); the capstone requirement (unit test for ≥1 component **or** an E2E critical-flow test) is satisfied by both. Coverage is concentrated on the data/schema/AI-client layers; UI pages that require auth/Supabase are not yet exercised.
- No test results or screenshots were fabricated; run the commands above to reproduce.

## Performance & accessibility

This project carries forward the **FE-10** audit results:

**Lighthouse (final):** Performance 99 · Accessibility 95 · FCP 1.7s · LCP 1.7s · TBT 10ms · CLS 0 · Speed Index 2.4s

**WAVE (final):** Errors 0 · Contrast Errors 0 · Alerts 0 · Features 5 · Structure 2 · ARIA 10 · AIM Score 10/10

Concrete improvements already in the code:

- Semantic `<main>` landmarks (`AppShell.jsx`, `LandingPage.jsx`, `AuthLayout.jsx`).
- `aria-live="polite"` regions for streamed/async AI output (`IdeaDetailPage.jsx`, `ChallengeMode.jsx`, `ValidationPlan.jsx`, `Toast.jsx`).
- Keyboard accessibility: focusable controls, `aria-label`s on icon buttons, modal focus handling (`Modal.jsx`), and Playwright keyboard-driven E2E flows.
- CSS contrast improvements via the Tailwind token system (`text-text-primary` / `text-text-secondary` on `background` / `elevated`).
- Performance: route-level code splitting (`React.lazy`) and small, gzip-friendly chunks (see `npm run build` output).

> The Lighthouse/WAVE numbers above are the documented FE-10 assignment results. No new audit was performed as part of this capstone.

## Deployment & operation

Deployment checklist (Vercel):

- [ ] `npm run build` passes (verified locally)
- [ ] `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) configured in Vercel project env (server-side only)
- [ ] `VITE_SUPABASE_*` configured if auth is enabled
- [ ] Production URL verified (visit after deploy)
- [ ] API endpoints verified: `POST /api/analyze`, `/api/challenge`, `/api/experiments`
- [ ] Error states verified (400/405/429/500/502/504)
- [ ] Rate limiting present (`checkRateLimit` in `analyzeCore.js`)
- [ ] Secrets not exposed to client (key only in `api/`, never `VITE_`-prefixed)
- [ ] Rollback plan: redeploy the last known-good commit from `main` via Vercel.

> No runtime monitoring/alerting is configured in this project; that is a future improvement.

## Safe failure

The API fails safely and never leaks secrets (verified in `api/analyzeCore.js`, `challengeCore.js`, `experimentsCore.js`):

| Condition | Behavior |
|-----------|----------|
| Invalid input | `400` with a clear message (`validateInput`) |
| Unsupported HTTP method | `405` (`req.method !== 'POST'`) |
| Missing `GEMINI_API_KEY` | `500` clear server error, key stays server-side |
| Gemini provider failure | controlled `502` |
| Timeout (60s `AbortController`) | controlled `504` |
| Rate limit exceeded | `429` |
| Invalid AI JSON | `502` schema validation failure |
| API key | remains server-side only |

---

## Scripts

```bash
npm run dev         # start Vite dev server
npm run build       # production build to dist/
npm run preview     # preview production build
npm run test        # run Vitest unit/component tests
npm run test:watch  # watch mode
npm run test:coverage # coverage report (requires @vitest/coverage-v8)
npm run test:e2e    # Playwright E2E tests
```

## Documentation

- [docs/CAPSTONE.md](./docs/CAPSTONE.md) — full structured capstone portfolio entry.
- [roadmap.md](./roadmap.md) — phased development plan.
- [UI-UX-GUIDELINES.md](./UI-UX-GUIDELINES.md) — design system & UX rules.
