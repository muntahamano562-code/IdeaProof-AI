# IdeaProof AI — UI/UX Guidelines

> Design system and UX rules for IdeaProof AI.
> "Challenge your idea before you build it."

This document is the single source of truth for how IdeaProof AI looks, feels,
and behaves. **Any AI coding agent or contributor must read this file before
implementing or modifying interface work.** Future screens must follow these
rules without introducing new visual patterns.

---

## 1. Design Direction

IdeaProof AI is a **startup intelligence platform**, not a chat app. The visual
direction:

- Modern AI SaaS, premium, analytical, calm, professional.
- Slightly futuristic but never neon/cyberpunk or flashy.
- Trustworthy and evidence-driven.
- Reference sensibilities: Linear, Notion, Vercel, modern AI dashboards — but do
  **not** copy any existing product.
- **Never** build a generic ChatGPT-style UI. The product is a structured
  validation workspace, not a conversation thread.

---

## 2. Design Principles

1. **Clarity over decoration.** Every element earns its place.
2. **Evidence over hype.** Show reasoning, not marketing.
3. **Progressive disclosure.** Reveal detail on demand; don't dump everything.
4. **Explain AI decisions.** Scores and verdicts always come with rationale.
5. **Every score has context.** A number alone is never enough.
6. **Avoid overwhelming users.** Sequence complexity; one primary action per view.
7. **Strong visual hierarchy.** Clear primary/secondary/tertiary emphasis.
8. **Consistent interaction patterns.** Same action, same look, everywhere.
9. **Mobile responsive by default.** Design for small screens, not as an afterthought.
10. **Accessibility first.** WCAG-conscious; usable without a mouse; readable.

---

## 3. Color System

All colors are defined as CSS variables (RGB channels) in `src/styles/index.css`
and mapped to Tailwind tokens in `tailwind.config.js`. Use tokens **only** — no
arbitrary hex/rgb in components.

### Base surfaces

| Token             | Light            | Dark             | Usage |
|-------------------|------------------|------------------|-------|
| `background`      | `#FAFAFB` (250 250 251) | `#090B11` (9 11 17)   | App background |
| `surface`         | `#FFFFFF` (255 255 255) | `#11141D` (17 20 29)  | Cards, panels |
| `elevated`        | `#FFFFFF` (255 255 255) | `#181C27` (24 28 39)  | Popovers, modals, menus |

### Brand & text

| Token             | Light            | Dark             | Usage |
|-------------------|------------------|------------------|-------|
| `primary`         | `#4F46E5` (79 70 229)   | `#818CF8` (129 140 248) | Primary actions, key accents |
| `secondary`       | `#0EA5E9` (14 165 233)  | `#38BDF8` (56 189 248)  | Secondary accents, links |
| `text-primary`    | `#111827` (17 24 39)    | `#EDF0F5` (237 240 245) | Body / headings |
| `text-secondary`  | `#64748B` (100 116 139) | `#94A3B8` (148 163 184) | Muted text, captions |
| `border`          | `#E2E8F0` (226 232 240) | `#262C3A` (38 44 58)    | Borders, dividers |

### Semantic

| Token       | Light                 | Dark                  | Usage |
|-------------|-----------------------|-----------------------|-------|
| `success`   | `#16A34A` (22 163 74)  | `#4ADE80` (74 222 128) | Positive / BUILD |
| `warning`   | `#D97706` (217 119 6)  | `#FBBF24` (251 191 36) | Caution / PIVOT |
| `danger`    | `#DC2626` (220 38 38)  | `#F87171` (248 113 113)| Negative / DON'T BUILD |
| `info`      | `#2563EB` (37 99 235)  | `#60A5FA` (96 165 250) | Informational |

### Risk scale (semantic, used by Risk Radar & risk cards)

| Token             | Light                 | Dark                  | Meaning |
|-------------------|-----------------------|-----------------------|---------|
| `risk-low`        | `#22C55E` (34 197 94)  | `#4ADE80` (74 222 128)| LOW |
| `risk-medium`     | `#EAB308` (234 179 8)  | `#FACC15` (250 204 21)| MEDIUM |
| `risk-high`       | `#EA580C` (234 88 12) | `#FB923C` (251 146 60)| HIGH |
| `risk-critical`   | `#DC2626` (220 38 38) | `#F87171` (248 113 113)| CRITICAL |

**Risk usage rules**
- Never overuse bright colors; risk colors appear only on actual risk surfaces.
- Severity must be conveyed by more than color alone (label + icon/text) for
  accessibility.
- The interface should feel professional, not alarming by default.

### Contrast requirements
- Body text (`text-primary`) on `background`/`surface`: ≥ 4.5:1 (WCAG AA).
- Muted text (`text-secondary`) on surfaces: ≥ 4.5:1 for body-sized text.
- Interactive accents must remain distinguishable from text when used as labels.
- In dark mode, reduce pure-white usage; rely on `text-primary` token.

---

## 4. Typography

Fonts (loaded in `index.html`):
- **Display / headings:** Space Grotesk
- **Body / UI:** Inter
- **Numeric / stat / code:** JetBrains Mono

| Role            | Family        | Size      | Weight | Line-height | Notes |
|-----------------|---------------|-----------|--------|-------------|-------|
| Display heading | Space Grotesk | 2.5rem (40px) | 600 | 1.1 | Hero only |
| H1              | Space Grotesk | 2rem (32px)    | 600 | 1.15 | Page titles |
| H2              | Space Grotesk | 1.5rem (24px)  | 600 | 1.2 | Section titles |
| H3              | Space Grotesk | 1.25rem (20px) | 600 | 1.25 | Card titles |
| Body            | Inter         | 1rem (16px)    | 400 | 1.6 | Default text |
| Small text      | Inter         | 0.875rem (14px)| 400 | 1.5 | Captions, hints |
| Labels          | Inter         | 0.75rem (12px) | 600 | 1.4 | Uppercase, letter-spacing |
| Button text     | Inter         | 0.9375rem (15px)| 500 | 1.4 | |
| Numeric/stat    | JetBrains Mono| per context   | 500 | 1.1 | Scores, metrics |

Rules:
- Use the spacing/scale tokens; do not set arbitrary `font-size` values.
- Limit display font to headings; never body.
- Numbers (scores, stats) use mono for a technical, precise feel.

---

## 5. Spacing & Layout

Use the spacing scale (Tailwind default + extensions). No magic numbers.

- **Spacing scale:** 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px),
  8 (32px), 10 (40px), 12 (48px), 16 (64px), 18 (72px), plus `4.5` (18px),
  `13` (52px), `15` (60px) extensions.
- **Container max width:** `max-w-container` = 75rem (1200px), centered, with
  horizontal padding `px-6` (24px) on desktop.
- **Page margins:** 24px mobile → 48px+ desktop.
- **Card padding:** `p-6` (24px) default; `p-4` (16px) compact.
- **Section spacing:** `py-16` to `py-18` between major sections.
- **Grid:** 12-column conceptual grid; use `grid` + `gap-6`. Dashboard uses a
  responsive 12-col grid collapsing to 1 col on mobile.
- **Dashboard layout:** left/right content regions on desktop (main analysis +
  supporting panels); single column scroll on mobile.
- **Breakpoints:** `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. Design
  mobile-first.

---

## 6. Component Guidelines

Reusable primitives live in `src/components`. Build them once; reuse everywhere.

- **Buttons:** primary (filled `primary`), secondary (outline), ghost (text).
  One primary action per view. Min height 40px. Focus-visible ring.
- **Inputs / Textareas:** `surface` bg, `border`, 12px radius, 14–16px padding,
  visible focus ring (`primary`), inline error text in `danger` with icon.
  Always paired with a `<label>`.
- **Selects:** styled native select for accessibility; custom dropdown only if
  native is insufficient.
- **Cards:** `surface` bg, 1px `border`, 12–14px radius, subtle shadow on
  `elevated` only when layered. Hover: slight border emphasis, not lift-heavy.
- **Badges:** small, rounded, token-colored; used for statuses/severity. Never
  the sole carrier of meaning (pair with text/icon).
- **Tooltips:** on hover/focus; accessible via keyboard; not for critical info.
- **Modals:** centered, `elevated` surface, scrim backdrop, focus trap, Esc to
  close, same radius scale.
- **Dropdowns / Menus:** `elevated`, subtle shadow, keyboard navigable.
- **Tabs:** underline or pill style; clear active state; arrow-key navigation.
- **Navigation / Sidebar:** clear active state (`primary` accent), collapsed on
  mobile to a bottom bar or hamburger drawer.
- **Toasts:** bottom-right, auto-dismiss, typed by semantic color, contain
  actionable text.
- **Alerts:** inline, semantic border + icon + text; not dismissible if blocking.
- **Progress indicators:** determinate bars for known progress; staged labels
  for AI work (see §9).
- **Score cards / Risk cards / Assumption cards:** structured cards with a
  title, a value/severity, and an explanation block. Never value-only.
- **Timeline:** vertical steps for validation plan; completed/active/upcoming
  states via tokens + icons.
- **Empty states:** friendly illustration or icon + one-line guidance + primary
  action. No blank screens.
- **Skeleton loaders:** token-based shimmer matching final layout; respect
  reduced motion.
- **Error states:** plain-language message + recovery action; never raw errors.

---

## 7. Core Product UI

1. **Landing page:** hero with clear value prop; "How it works" steps; feature
   highlights; trust section; footer. Calm, confident, no hype words.
2. **Dashboard:** greeting + recent ideas grid; quick "New idea" action;
   status badges. Scannable, low density.
3. **New Idea form:** stepwise or single structured form; inline guidance per
   field; draft recovery; validation before submit.
4. **Analysis dashboard:** overall score ring → category scores → risk radar →
   assumptions → findings → MVP rec → verdict. Progressive disclosure.
5. **Score visualization:** ring for overall; horizontal bars or small cards for
   categories; each with explanation.
6. **Risk Radar:** Recharts radar with severity-colored axes/points; legend;
   accessible text alternative (list) on mobile/screen readers.
7. **Assumption detector:** cards listing each assumption, why it matters, and
   how to test it.
8. **AI Challenge Mode:** question → user answer → AI counterargument; updated
   assessment; history. Clearly a simulation of scrutiny.
9. **Validation plan:** experiments as timeline/cards with hypothesis, method,
   success criteria, timeline.
10. **Final verdict:** BUILD / PIVOT / DON'T BUILD with cautious framing (see §10).
11. **Saved ideas / history:** filterable list; open/delete/archive; empty state.
12. **Report / export:** clean printable layout of all sections; one export
    format for MVP.

---

## 8. AI UX Guidelines (critical)

AI output is **assessment, not fact.** Enforce these rules:

- Never present AI output as absolute truth or verified fact.
- Clearly label AI-generated content (e.g. "AI assessment", "Generated by AI").
- Always explain *why* a score or conclusion was reached.
- Distinguish **user-provided facts** (from their idea input) from **AI
  assumptions/inference** (label them).
- Show uncertainty where appropriate (confidence indicators, caveats).
- Avoid fake precision (don't overstate decimal-level certainty).
- Never imply the AI verified information it did not verify.
- When external research is later added, attach citations/evidence.
- Always provide useful next actions after AI output.
- Allow users to challenge or correct AI findings (Challenge Mode).

**Loading states for AI operations** — use meaningful staged labels, not a bare
"Loading…":

- "Understanding your idea…"
- "Identifying your target user…"
- "Looking for hidden assumptions…"
- "Stress-testing your idea…"
- "Building your validation plan…"

If the backend cannot report real granular progress, design these as **staged UI
states** (predictable sequence) rather than falsely claiming live model
progress. Never fake precise progress percentages the backend didn't produce.

---

## 9. Score UX

- **Overall Score** displayed as `71/100` in mono, inside a score ring.
- Always captioned: *"AI assessment based on the information provided."*
- Scores never appear without explanation; each shows a short rationale.
- **Score ring:** circular progress, `primary` track, label in center.
- **Score card:** title + value + one-line explanation + (optional) confidence.
- **Category score:** horizontal bar or small card, token-colored, with context.
- **Confidence indicator:** when present, show as a subtle label ("Moderate
  confidence") — never as a fake precise metric.
- Use `success`/`warning`/`danger` only to hint direction, with text always
  present.

---

## 10. Verdict UX

Visual treatment for the three outcomes, framed as a recommendation, not a decree:

- **BUILD** — `success` accent.
- **PIVOT** — `warning` accent.
- **DON'T BUILD YET** — `danger` accent.

Framing rules:
- Heading: **"Current recommendation"**.
- Subtext: **"Based on the information available"** (never "definitely").
- Include the key reasons and what would change the verdict.
- Avoid definitive, unquestionable language; the user makes the final call.

---

## 11. Responsive Design

- **Desktop (≥1024px):** full dashboard grid; sidebar or top nav; multi-column
  analysis layout.
- **Tablet (768–1023px):** 2-column where possible; condensed nav.
- **Mobile (<768px):** single-column stack; bottom nav or hamburger drawer;
  Risk Radar degrades to an accessible list; score ring scales down but stays
  legible; touch targets ≥ 44px.
- Do **not** simply shrink the desktop UI; re-flow and prioritize content.
- Navigation: bottom tab bar or slide-in drawer on mobile; persistent top bar
  with primary action on desktop.

---

## 12. Accessibility

- WCAG AA contrast (see §3).
- Full keyboard navigation; visible `focus-visible` rings on all interactive
  elements.
- Semantic HTML (`header`, `main`, `nav`, `section`, `article`, `button`,
  `label`).
- Accessible forms: associated labels, `aria-invalid`, descriptive errors.
- ARIA only when semantic HTML is insufficient (e.g. `role="alert"` for errors,
  `aria-live` for AI status updates).
- Screen-reader-friendly score/verdict descriptions (e.g. "Overall AI assessment
  score 71 out of 100, moderate confidence").
- `prefers-reduced-motion` honored globally (see `index.css`).
- Touch targets ≥ 44×44px on mobile.
- Error messaging: plain language, points to recovery, not blameful.

---

## 13. Motion

Subtle and purposeful; never decorative excess.

- **Page transitions:** short cross-fade (150–200ms).
- **Card hover:** border/background shift only; minimal translate.
- **Score animation:** count-up or ring fill (≤ 600ms); skippable under reduced
  motion.
- **Loading animation:** gentle pulse/shimmer; no spinners that imply false
  precision.
- **Modal transitions:** fade + slight scale (150ms); respect reduced motion.

Global rule: if `prefers-reduced-motion: reduce`, disable non-essential motion
(see `index.css` media query).

---

## 14. UX Writing

**Voice:** confident, intelligent, honest, concise, helpful, non-judgmental.

Avoid: exaggerated AI claims, "revolutionary", "guaranteed success",
manipulative or fear-based language.

Examples:

| Bad (avoid)                          | Good (use) |
|--------------------------------------|------------|
| "AI guarantees your startup will win"| "Based on what you shared, here's where the risk sits." |
| "Revolutionary idea detected!"        | "Your idea addresses a clear problem." |
| "Loading..."                         | "Looking for hidden assumptions…" |
| "FAILED" (verdict)                   | "Current recommendation: DON'T BUILD YET" |
| "Our AI knows best."                 | "This is an AI assessment — you make the final call." |

---

## 15. Design System Rules

Future implementation must follow:

- Don't introduce random colors — use tokens only.
- Don't introduce random border radii — use the radius scale.
- Don't use arbitrary font sizes — use the type scale.
- Don't create duplicate button/styles — reuse primitives.
- Don't use emoji as the primary UI icon system — use a consistent icon library.
- Reuse existing components; don't rebuild.
- Keep visual hierarchy consistent across screens.
- Don't create a new pattern when an existing component solves it.

---

## 16. Implementation Rules (for AI coding agents)

1. Read this file before implementing or modifying any UI.
2. Follow the design tokens; never hardcode colors/sizes.
3. Reuse existing components in `src/components`; extend, don't duplicate.
4. Do not introduce new dependencies without justification.
5. Do not redesign established screens without approval.
6. Keep accessibility requirements intact (keyboard, contrast, labels).
7. Keep mobile responsiveness intact.
8. Do not use placeholder/fake UI in production screens.
9. Keep AI-generated information clearly distinguishable from user input/fact.
10. Preserve the established visual language and motion rules.
