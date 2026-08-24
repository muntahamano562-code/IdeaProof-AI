# IdeaProof AI

> Challenge your idea before you build it.

IdeaProof AI is an AI-powered startup and product idea validation platform. A user enters a business, startup, app, or product idea, and the system analyzes assumptions and risks, challenges the idea from a skeptical perspective, proposes validation experiments, recommends an MVP, and produces a final BUILD / PIVOT / DON'T BUILD verdict.

## Tech stack

- React + Vite (JavaScript)
- Tailwind CSS
- Supabase (auth + persistence, later phases)
- Vercel Serverless Functions (API routes)
- LLM accessed only via server-side API routes

## Status

**Foundation stage (Phase 0).** Project scaffold, architecture, design tokens, and documentation are in place. Product features are not implemented yet.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite (default http://localhost:5173).

```bash
npm run build      # production build
npm run preview    # preview the production build
```

## Project structure

```
ideaproof-ai/
├── public/              # static assets
├── src/
│   ├── components/      # reusable UI components
│   ├── pages/           # route-level pages
│   ├── layouts/         # layout shells
│   ├── features/        # feature modules
│   ├── hooks/           # custom React hooks
│   ├── lib/             # utilities & clients
│   ├── services/        # API/service clients
│   ├── schemas/         # validation schemas (Zod, later)
│   ├── data/            # static/seed data
│   ├── styles/          # global styles
│   └── App.jsx
├── api/                 # Vercel serverless functions
├── docs/                # additional documentation
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── roadmap.md
└── UI-UX-GUIDELINES.md
```

## Documentation

- [roadmap.md](./roadmap.md) — full phased development plan
- [UI-UX-GUIDELINES.md](./UI-UX-GUIDELINES.md) — design system & UX rules
