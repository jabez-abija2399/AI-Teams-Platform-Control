# AI Teams Platform
# Current Task


Version:

1.0


Last Updated:

2026-08-06


# Active Task


Task Name:

Step-by-step: Verify → DB → React scaffold


Status:

Completed


# Results


## Step 1 — Verify HTML/CSS path

- Added `tests/project-stack/step1-html-css-path.test.ts` — **5/5 passed**
- Default/recommended stack = `static-html`
- Heuristic emits login/signup/home without Next/React


## Step 2 — Fix DB

- Root cause: TCP password in `.env` invalid; peer auth via unix socket works
- Set `DATABASE_URL` to socket form: `postgresql://jabez@localhost:5432/ai_teams_platform?host=/var/run/postgresql`
- Applied `prisma/manual/add_file_review_columns.sql` → `reviewStatus` + `previousContent` on `files`
- DB connect verified (`FILES_COUNT` readable)
- Skipped full `prisma db push --accept-data-loss` (would recreate workflow array columns); app already uses jsonb-safe helpers


## Step 3 — React/Vite scaffold

- Added `react-vite-scaffold.ts` (Vite + App + Yacht Club styles)
- `buildHeuristicImplementation` branches on `react-vite` / confirmed React
- Confirmed React maps to `DeliveryStack: react-vite` (not Next)
- Tests: `tests/project-stack/step3-react-vite.test.ts`


# How to verify in UI


1. Create project with HTML/CSS → Studio Preview Fast → pages show, no stack ask  
2. Create project with React → Development/ensure → `vite.config.ts` + `src/App.tsx` in Explorer  
3. Preview Fast = instant · Full = Vite WebContainer  
