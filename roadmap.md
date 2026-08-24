# IdeaProof AI — Roadmap

> "Challenge your idea before you build it."

This roadmap is the executable build plan for IdeaProof AI. It is organized into
phases. Each phase lists an **Objective**, **Features / Tasks**, **Dependencies**,
**Definition of Done**, and **Technical Notes**.

Labels used throughout:

- **MVP** — required for the first shippable version of IdeaProof AI.
- **POST-MVP** — planned but explicitly out of scope for the MVP.

Do not start a later phase until the current phase's Definition of Done is met.
Follow `UI-UX-GUIDELINES.md` for all interface work. Keep AI calls strictly
server-side (see `api/`).

---

## PHASE 0 — Foundation

**Objective**
Establish a clean, production-quality project scaffold, architecture, design
tokens, documentation, and version control so every later phase builds on a
stable base.

**Features / Tasks**
- Create project folder `ideaproof-ai`.
- Initialize React + Vite (JavaScript) project.
- Configure Tailwind CSS with design tokens (light + dark) from `UI-UX-GUIDELINES.md`.
- Create the directory structure (`src/components`, `src/pages`, `src/layouts`,
  `src/features`, `src/hooks`, `src/lib`, `src/services`, `src/schemas`,
  `src/data`, `api`, `docs`, `public`).
- Create `.env.example` (no real secrets; document all future env vars).
- Create `.gitignore` (ignore `node_modules`, `dist`, `.env`, coverage, etc.).
- Write `roadmap.md` and `UI-UX-GUIDELINES.md`.
- Write minimal `README.md`.
- Initialize Git and create the initial commit.

**Dependencies**
- Node.js + npm.
- This document and `UI-UX-GUIDELINES.md`.

**Definition of Done**
- `npm install` succeeds.
- `npm run build` succeeds with no errors.
- `npm run dev` starts and serves the app.
- `roadmap.md`, `UI-UX-GUIDELINES.md`, `README.md`, `.env.example` exist.
- Git working tree is clean after the initial commit.

**Technical Notes**
- Only foundational dependencies installed now: `react`, `react-dom`, `vite`,
  `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`.
- Do NOT add product features, fake AI data, or placeholder dashboards yet.
- Design tokens live in `src/styles/index.css` (CSS variables) and are mapped
  in `tailwind.config.js`. Future components must use these tokens only.

---

## PHASE 1 — Design System & UI Foundation

**Objective**
Build a reusable, token-driven design system so all screens share one visual
language.

**Features / Tasks (MVP)**
- Implement core primitives: `Button`, `Input`, `Textarea`, `Select`, `Card`,
  `Badge`, `Tooltip`, `Modal`, `Toast`, `Alert`, `Tabs`, `Skeleton`, `Spinner`.
- Implement layout primitives: `Container`, `Section`, `Stack`, `Grid`.
- Add a `cn()` utility in `src/lib` (clsx + tailwind-merge) for class merging.
- Define typography scale, spacing scale, and radii via Tailwind config + tokens.
- Add light/dark theme switching (no flash; respect `prefers-color-scheme`).
- Establish focus-visible styles and base accessibility rules.

**Dependencies**
- Phase 0 complete.

**Definition of Done**
- All primitives render correctly in light and dark mode.
- A small internal "component playground" page (dev-only, not shipped) shows
  each primitive; removed or gated before release.
- Every primitive uses only design tokens (no arbitrary colors/sizes).

**Technical Notes**
- Prefer building small primitives ourselves over pulling in shadcn/ui until a
  clear need exists; if shadcn/ui is adopted later, follow the tokens exactly.
- Recharts is NOT needed in this phase.
- Components go in `src/components` and are composed into feature UIs later.

---

## PHASE 2 — Landing Page

**Objective**
Communicate what IdeaProof AI does and convert visitors into sign-ups.

**Features / Tasks (MVP)**
- Hero section with headline, subhead, primary CTA ("Start validating"),
  secondary CTA ("See how it works").
- Product explanation / value proposition section.
- "How it works" 3–4 step section (Enter idea → Get challenged → Validate → Decide).
- Feature highlights (assumption detection, risk radar, challenge mode, verdict).
- Social proof / trust section placeholder (no fake testimonials).
- Final CTA section.
- Footer with links, legal placeholder, and theme toggle.
- Responsive layout (desktop / tablet / mobile).

**Dependencies**
- Phase 1 (design system).

**Definition of Done**
- Page is fully responsive and accessible (keyboard nav, semantic HTML).
- All copy follows the UX writing rules in `UI-UX-GUIDELINES.md`.
- No AI functionality on this page yet; CTAs route to auth/idea creation.

**Technical Notes**
- Landing page is a static route (`src/pages/LandingPage.jsx`).
- Keep it dependency-light; no charts here.
- Motion must respect `prefers-reduced-motion`.

---

## PHASE 3 — Authentication & App Shell

**Objective**
Let users create accounts, sign in, and access a protected application shell.

**Features / Tasks (MVP)**
- Supabase project setup (auth only; defer database tables to Phase 9).
- Email/password sign-up, sign-in, sign-out.
- Password reset flow (email link).
- Protected routes (redirect to sign-in when unauthenticated).
- App shell: top bar / sidebar, navigation, user menu, theme toggle.
- Route structure: `/`, `/login`, `/signup`, `/dashboard`, `/ideas/new`,
  `/ideas/:id`.

**Dependencies**
- Phase 1 (UI primitives).
- Supabase account + env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

**Definition of Done**
- A user can sign up, confirm email, sign in, and reach the dashboard.
- Unauthenticated users cannot access `/dashboard` or `/ideas/*`.
- Auth state persists across reloads.

**Technical Notes**
- Supabase client lives in `src/services/supabase.js` (browser-safe anon key only).
- NEVER put `SUPABASE_SERVICE_ROLE_KEY` or any LLM key in frontend code.
- Use React Router (add in this phase) for routing.

---

## PHASE 4 — Idea Creation

**Objective**
Capture a user's idea and supporting context in a structured, validated form.

**Features / Tasks (MVP)**
- "New Idea" form with fields: title, description, problem, target audience,
  current stage, links (optional), constraints (optional).
- Client-side validation with Zod (`src/schemas/idea.schema.js`).
- Save draft locally (localStorage) so users don't lose work.
- Submit creates a record (Supabase) and routes to analysis.
- Empty-state and guidance copy for each field.

**Dependencies**
- Phase 3 (auth + persistence basics).
- Zod (add dependency in this phase).

**Definition of Done**
- Form validates input and shows inline, accessible errors.
- Draft is recoverable after refresh.
- On submit, an idea record exists and analysis can be triggered.

**Technical Notes**
- Zod schemas double as runtime validation for API responses later.
- No AI calls in this phase.

---

## PHASE 5 — AI Analysis Engine

**Objective**
Turn a submitted idea into a structured, explainable analysis using an LLM,
accessed only through server-side API routes.

**Features / Tasks (MVP)**
- Server-side route `api/analyze.js` (Vercel Serverless Function).
- LLM call using `LLM_API_KEY` (server-only); never exposed to browser.
- Structured output schema (Zod-validated server-side) covering:
  - Idea summary / extraction
  - Problem analysis
  - Target audience analysis
  - Feasibility analysis
  - Competition analysis
  - Assumption detection (list with rationale)
  - Risk analysis (list with severity: LOW/MEDIUM/HIGH/CRITICAL)
  - Category scores (e.g. Problem Clarity, Market, Feasibility, Differentiation,
    Momentum)
  - Overall score (0–100) with confidence
  - MVP recommendation
  - Validation experiments (list with success criteria + timeline)
  - Final verdict: BUILD / PIVOT / DON'T BUILD
- Streaming or staged progress states on the client (see AI UX guidelines).
- Validate LLM JSON against the Zod schema; handle malformed output gracefully.

**Dependencies**
- Phase 4 (idea record).
- LLM provider account + API key.
- Zod (already added).

**Definition of Done**
- A real idea submitted by an authenticated user produces a structured analysis.
- All scores have explanations; the verdict is labeled "Current recommendation".
- AI output is clearly marked as an assessment, not fact.
- Errors (LLM timeout, invalid JSON) are handled with user-friendly messages.

**Technical Notes**
- Keep the prompt engineering in `api/`; never ship the prompt or key to client.
- Return only the validated structured object to the client.
- Add rate limiting / basic abuse protection at the route level (POST-MVP can
  deepen this).
- Do not hardcode fake analysis results anywhere in the app.

---

## PHASE 6 — Analysis Dashboard

**Objective**
Present the AI analysis in a clear, scannable, evidence-aware interface.

**Features / Tasks (MVP)**
- Overall score ring with explanation + "AI assessment based on the information
  provided."
- Category score cards (each with context).
- Risk Radar (Recharts radar) with severity colors.
- Assumption cards (each assumption + why it matters + how to test it).
- Key findings / summary section.
- MVP recommendation block.
- Validation experiments preview (links to Phase 8).
- Final verdict block (BUILD / PIVOT / DON'T BUILD) with cautious wording.

**Dependencies**
- Phase 5 (analysis data).
- Recharts (add dependency in this phase).

**Definition of Done**
- Every score/risk/assumption is shown with explanation, not in isolation.
- Dashboard is responsive (mobile collapses radar to list/compact view).
- No AI output is presented as verified fact.

**Technical Notes**
- Recharts used only here; keep bundle mindful.
- Risk severity maps to token colors `risk-low` / `risk-medium` / `risk-high`
  / `risk-critical`.

---

## PHASE 7 — AI Challenge Mode

**Objective**
Let users stress-test their idea through an interactive skeptical dialog.

**Features / Tasks (MVP)**
- Surface 3–5 challenge questions derived from the analysis.
- User responds to each challenge.
- Server route sends responses back to LLM for counterarguments / updated view.
- Show updated assessment (what changed, what didn't).
- Challenge history persists with the idea.

**Dependencies**
- Phase 5 (analysis + server routes).

**Definition of Done**
- A user can answer challenges and receive AI counterarguments.
- The interaction is clearly labeled as a simulation of skeptical scrutiny.
- Updated assessment is explainable and non-definitive.

**Technical Notes**
- New server route `api/challenge.js`.
- Keep responses focused; avoid open-ended chat that drifts.

---

## PHASE 8 — Validation Experiments

**Objective**
Turn analysis into an actionable validation plan.

**Features / Tasks (MVP)**
- List AI-generated experiments with: hypothesis, method, success criteria,
  effort estimate, timeline.
- Mark experiments as planned / in-progress / done (local + later persisted).
- Link experiments back to assumptions they test.

**Dependencies**
- Phase 6 (analysis dashboard).

**Definition of Done**
- Experiments are clearly tied to assumptions/risks.
- Success criteria are concrete and measurable.

**Technical Notes**
- Experiment tracking persistence is deepened in Phase 9/POST-MVP.

---

## PHASE 9 — History & Persistence

**Objective**
Let users revisit and manage their ideas and past analyses.

**Features / Tasks (MVP)**
- Saved Ideas list / History page.
- Open a previous analysis.
- Delete / archive ideas.
- Persist analyses to Supabase (tables created here).

**Dependencies**
- Phases 4–6.
- Supabase database tables.

**Definition of Done**
- A user can see all their ideas, reopen any analysis, and delete/archive.
- Data is correctly scoped per authenticated user (RLS enabled).

**Technical Notes**
- Enable Row Level Security so users only see their own data.

---

## PHASE 10 — Reports

**Objective**
Let users export and optionally share their validation work.

**Features / Tasks (MVP)**
- Generate an in-app validation report view (all sections, printable).
- Export report (e.g. Markdown or printable view).

**POST-MVP**
- PDF export.
- Shareable public read-only report link.

**Dependencies**
- Phases 6–9.

**Definition of Done (MVP)**
- User can view a complete report and export it in at least one format.

---

## PHASE 11 — Testing

**Objective**
Establish confidence through automated tests.

**Features / Tasks**
- Unit tests (Vitest) for utilities and schemas.
- Component tests (React Testing Library) for primitives and key flows.
- API tests for server routes (mock LLM; assert Zod validation + error handling).
- AI response validation tests (malformed JSON handled).
- E2E tests (Playwright) for critical paths: signup → new idea → analysis →
  history.

**Dependencies**
- All MVP phases.
- Vitest, React Testing Library, Playwright (add in this phase).

**Definition of Done**
- `npm run test` passes; E2E suite covers the core happy path.
- Schema validation prevents bad data from reaching the UI.

---

## PHASE 12 — Accessibility & Performance

**Objective**
Meet quality bars for accessibility and speed.

**Features / Tasks (MVP + hardening)**
- Lighthouse performance, accessibility, best-practices ≥ 90 where feasible.
- Full keyboard navigation across all flows.
- Screen-reader checks for scores, verdicts, and AI content.
- `prefers-reduced-motion` honored everywhere.
- Bundle optimization (code-split routes, lazy-load Recharts).
- Loading states / skeletons for all async surfaces.

**Dependencies**
- All MVP phases.

**Definition of Done**
- No critical a11y violations; reduced-motion verified.
- Initial JS bundle is reasonably split; no single huge chunk.

---

## PHASE 13 — Production

**Objective**
Ship a secure, reliable product.

**Features / Tasks**
- Security review (no secrets in client; server-only keys verified).
- Environment variable checklist (production `.env`).
- Rate limiting on API routes.
- Input validation on all endpoints (Zod).
- Centralized error handling + user-friendly error pages.
- Production deployment to Vercel.
- Final QA pass across devices and browsers.

**Dependencies**
- Phases 0–12.

**Definition of Done**
- Deployed to Vercel; protected routes and API routes functional.
- No console/build errors in production build.
- Secrets confirmed absent from the client bundle.

---

## POST-MVP Backlog (explicitly out of MVP scope)

- Competitor research (live web data).
- Idea comparison (side-by-side).
- Version history of analyses.
- Shareable public reports with access control.
- PDF export.
- Experiment tracking with evidence collection.
- Team / collaboration features.
- Integrations (e.g. analytics, CRM).

These are tracked here so they are not accidentally built during MVP phases.
