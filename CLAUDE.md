# Resume UI

AI-powered resume tailoring SaaS frontend. Users upload resumes, paste job descriptions, get AI-tailored resumes with match scoring, and export to PDF.

## Backend

The backend lives at `../resume` (FastAPI). Reference it for API contracts, endpoint definitions, and data models. It has its own `CLAUDE.md`.

## Tech Stack

- React 19, TypeScript 5.8 (strict), Vite 7
- Tailwind CSS 4 (`@import "tailwindcss"` syntax, NOT v3 `@tailwind` directives)
- shadcn/ui (New York style, Zinc base color, CSS variables, Lucide icons)
- React Router 7 (react-router-dom)
- Supabase JS (auth + database), Stripe (payments), PostHog (analytics)
- State management: React Context API exclusively (no Redux/Zustand)

## Commands

```bash
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build
npm run lint           # ESLint check
npm run lint:fix       # ESLint autofix
npm run test           # Vitest single run
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with v8 coverage
```

## Directory Structure

```
src/
  components/        # App components (named exports, function declarations)
  components/ui/     # shadcn/ui primitives — DO NOT manually edit, use shadcn CLI
  contexts/          # React Context providers (Auth, Subscription, Stripe, Tour, Theme, Notification, AuthModal, Template)
  hooks/             # Custom hooks (useIsMobile, useJobStatusPolling, useTour)
  lib/               # Utilities — auth.ts (authenticatedFetch), supabase.ts, analytics.ts, utils.ts (cn helper)
  pages/             # Route-level page components (lazy-loaded)
  services/          # API modules (resume.ts, billing.ts)
  types/             # TypeScript type definitions
  test/              # Test setup (setup.ts with jsdom mocks)
```

## Routes

```
/                       → LandingPage (unauth) or redirect to /studio (auth)
/login, /signup         → Redirect to / with auth modal
/auth/callback          → Supabase auth callback
/features, /pricing, /faq, /about, /contact → Public pages

Protected:
/studio                 → ResumeStudioPage (main app)
/editor, /editor/:id    → ResumeEditorPage
/templates              → TemplatesPage
/history                → HistoryPage
/account                → AccountSettingsPage
```

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Backend API endpoint | `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Supabase project URL | required |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | required |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | optional |
| `VITE_STRIPE_PRICE_BASIC` | Basic plan price ID | optional |
| `VITE_STRIPE_PRICE_PREMIUM` | Premium plan price ID | optional |
| `VITE_PUBLIC_POSTHOG_KEY` | PostHog analytics key | optional |
| `VITE_PUBLIC_POSTHOG_HOST` | PostHog API host | optional |

## API Calls to Backend

All calls go through `authenticatedFetch()` (`src/lib/auth.ts`) which attaches the Bearer token from Supabase session and prefixes `VITE_API_BASE_URL`.

### Resume Service (`src/services/resume.ts`)
- `POST /resumes` — Create resume
- `GET /resumes?limit=50` — List resumes
- `GET /resumes/{id}` — Get resume
- `PATCH /resumes/{id}` — Update resume
- `DELETE /resumes/{id}` — Delete resume
- `POST /convert?format=pdf&store=true&template={id}&primary_color={c}&secondary_color={c}` — PDF export
- `POST /edit-text` — AI text editing `{text, instruction}`
- `POST /parse/job` — Parse job description (FormData: `url` or `text`)
- `POST /match/enhanced` — Resume-job matching `{resume_jsonresume, job_json}`
- `POST /tailor?format=pdf&store=true&guaranteed=true&max_retries={n}` — Tailor resume

### Billing Service (`src/services/billing.ts`)
- `GET /billing/status` — Billing status & entitlements
- `POST /billing/checkout-session` — Stripe checkout `{price_id, promo_code, success_url, cancel_url}`
- `POST /billing/portal-session` — Customer portal `{return_url}`
- `POST /billing/create-subscription` — Create subscription `{price_id, promo_code}`
- `GET /billing/validate-promo?code={code}` — Validate promo code
- `POST /billing/embedded-checkout-session` — Embedded checkout `{price_id, promo_code, return_url}`

## Dev Workflow

1. Start backend: `cd ../resume && python run.py` (port 8000)
2. Start frontend: `npm run dev` (Vite, port 5173)
3. Pre-commit hook (Husky): runs lint + test + coverage — blocks commit on failure

## Conventions

### Imports
- Always use the `@/` path alias: `import { Button } from '@/components/ui/button'`
- Never use relative paths like `../../`

### Components
- Named exports: `export function MyComponent() {}`
- Function declarations, not arrow functions, for components

### Styling
- Tailwind utility classes only — no CSS modules, no styled-components
- Use `cn()` from `@/lib/utils` for conditional class merging
- Use CSS variable tokens: `bg-background`, `text-foreground`, `border-border`
- Dark mode via `.dark` class strategy

### State & Data
- React Context for global state — follow patterns in `src/contexts/`
- API calls through `authenticatedFetch()` from `@/lib/auth.ts` (auto-attaches Bearer token)
- Supabase client from `@/lib/supabase.ts` for direct auth operations

### Testing
- Vitest + @testing-library/react + jsdom
- Colocated test files: `Component.test.tsx`
- Setup in `src/test/setup.ts` (mocks localStorage, matchMedia)
- Mock external services (Supabase, Stripe, PostHog) — never call real APIs

## Do NOT

- Manually edit files in `src/components/ui/` — managed by shadcn CLI
- Use `@tailwind` directives — Tailwind v4 uses `@import "tailwindcss"`
- Install state management libraries — use Context API
- Use default exports for components
- Use `any` type unless unavoidable
- Commit `.env` files
- Bypass the Husky pre-commit hook (runs lint + test + coverage)
