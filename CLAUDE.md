# Resume UI

AI-powered resume tailoring SaaS frontend. Users upload resumes, paste job descriptions, get AI-tailored resumes with match scoring, and export to PDF. Connects to the AiResume FastAPI backend at `VITE_API_BASE_URL`.

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
  contexts/          # React Context providers (Auth, Subscription, Stripe, Tour, Theme, Notification, AuthModal)
  hooks/             # Custom hooks (useIsMobile, useJobStatusPolling, useTour)
  lib/               # Utilities — auth.ts (authenticatedFetch), supabase.ts, analytics.ts, utils.ts (cn helper)
  pages/             # Route-level page components
  services/          # API modules (resume.ts, billing.ts)
  types/             # TypeScript type definitions
  test/              # Test setup (setup.ts with jsdom mocks)
```

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
