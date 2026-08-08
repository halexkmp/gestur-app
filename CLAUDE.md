# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gestur App is a management system for tourism/business operations (sales, HR, inventory, partner/"Buggyman" loans, reports, audit trails), built with React 18, TypeScript, Vite, and Tailwind CSS. There is no client-side router — `src/App.tsx` switches between page components based on a `currentPage` string held in local state. The backend is a separate service consumed via `VITE_API_URL`, documented by the hand-maintained contract at `specs/api/*.md`.

## Commands

```bash
npm run dev         # start Vite dev server
npm run build        # production build
npm run preview      # preview a production build
npm run lint          # eslint over the whole repo
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run test           # vitest
```

Run a single test file: `npx vitest run src/hooks/useLoans.test.ts`

**Known issue:** one suite, `src/hooks/useEmployeePaychecks.test.ts`, fails on an argument-matching assertion. It is a pre-existing failure unrelated to any current work — treat `1 failed` as the baseline and only investigate additional failures.

## Architecture

Strict layering — respect it when adding or editing code:

```
components/  → UI only, renders + user interaction
hooks/       → reusable logic, state orchestration, calls services (never fetch directly)
services/    → API communication only (calls src/lib/api.ts), returns typed objects, throws descriptive errors
lib/         → stable utilities (api client, formatters, constants)
types/       → interfaces/enums/models, re-exported through types/index.ts as `export * from './x'`
contexts/    → shared app state (currently only AuthContext)
```

- **API client** (`src/lib/api.ts`): a thin `fetch` wrapper (`api.get/post/put/patch/delete`) that attaches a Bearer token from `localStorage.auth_token`, JSON-encodes bodies (passes `FormData` through untouched), and on a `401` clears the token and redirects to `/login`. All backend calls go through this — services call `api.*`, nothing else does.
- **Auth** (`src/contexts/AuthContext.tsx`): token-based, not Firebase despite the `firebase` dependency in `package.json` (Firebase/Firestore is only referenced, commented out, in `Audit.tsx`). `useAuth()` exposes `user`, `loading`, `signIn`/`signOut`, and role booleans (`isSuperAdmin`, `isManager`, `isAdmin` = super admin or manager, `isHR`, `isEmployee`) derived from `user.roles`. Roles: `ADMIN`, `MANAGER`, `HUMAN_RESOURCES`, `OPERATOR`, `EMPLOYEE`.
- **Page composition** (`src/App.tsx`): after login, `AppContent` picks the initial page (`journey` for pure employees, `sales` otherwise) and renders one of the top-level page components (`Sales`, `Products`, `Buggyman`, `Business`, `Reports`, `StockControl`, `Users`, `Audit`, `HR`, `EmployeeJourney`, `AdminJourney`) inside `Layout`, which also drives the sidebar nav and role-gated menu items.
- **Domain slice pattern**: each domain (loan, partner, product, sale, stock, employee, journey, user) has a matching `types/<domain>.ts`, `services/<domain>Service.ts`, and usually a `hooks/use<Domain>.ts`. Follow `loanService.ts` / `useLoans.ts` as the reference implementation when adding a new domain or extending an existing one.

## Feature Documentation Convention

Feature planning docs are managed through [spec-kit](https://github.com/github/spec-kit) (`.specify/`), via the `speckit-specify` / `speckit-plan` / `speckit-tasks` slash commands, writing to `specs/<feature>/`. The older ad hoc `docs/<feature-name>/{requirements,plan,tasks}.md` convention has been retired — do not recreate it.

## API Contract Reference

`specs/api/*.md` (`auth`, `employees`, `journey`, `loans`, `partners`, `products`, `reports`, `roles`, `sales`, `shared`, `users`) is the hand-maintained, human-readable contract for the backend consumed via `VITE_API_URL`, and is the **sole source of truth** for backend behavior — including real behavioral quirks (write-only fields, inconsistent response shapes between endpoints, silent permission downgrades, server-computed fields, etc.). There is no OpenAPI schema checked into the repo; a previous `back-end-openapi.json` was removed for being outdated and must not be reintroduced or relied upon. Treat `specs/api/*.md` as authoritative for "what the backend actually does."

It is scanned automatically before every `/speckit-specify` run via the `api-contract-check` skill, registered as a `before_specify` hook in `.specify/extensions.yml` — it surfaces the endpoints/shapes/quirks in `specs/api/*.md` relevant to the new feature. Invoke it directly (`/api-contract-check <description>`) any time you need the same scan outside of `/speckit-specify`, e.g. before `/speckit-plan` when locking in implementation details. If the contract turns out to be wrong or incomplete, update the affected `specs/api/*.md` file(s) by hand.
