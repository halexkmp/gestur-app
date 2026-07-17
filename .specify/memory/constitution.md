<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: n/a
- Modified sections: Feature Documentation Convention — the ad hoc `docs/<feature-name>/`
  folder pattern is retired (the folder was deleted as outdated, 2026-07-17) in favor of
  the spec-kit workflow (`.specify/`, `specs/<feature>/`) already installed in this repo
- Added sections: none
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gate is derived dynamically
    from this file's principles; no stale references found)
  - ✅ .specify/templates/spec-template.md (no constitution-specific references to sync)
  - ✅ .specify/templates/tasks-template.md (no constitution-specific references to sync)
  - ✅ CLAUDE.md (Feature Documentation Convention section updated to match)
  - ✅ README.md (no constitution-specific references)
- Follow-up TODOs: none.

Sync Impact Report (v1.0.0, retained for history)
- Version change: [TEMPLATE] → 1.0.0
- Modified principles: n/a (initial ratification from unfilled template)
- Added sections: Core Principles (I–V), Feature Documentation Convention, Development
  Workflow & Quality Gates, Governance
- Removed sections: none (template placeholders only)
- Follow-up TODOs: none. Principles were derived from the current, observed state of the
  codebase (README.md, CLAUDE.md, src/ layering) rather than the removed AGENTS.md, which
  the project maintainer identified as outdated (2026-07-17) — notably its blanket
  "NOT CREATE ANY TEST" rule, which contradicted the existing Vitest setup and test files.
-->

# Gestur App Constitution

## Core Principles

### I. Layered Architecture (NON-NEGOTIABLE)
The codebase MUST maintain strict separation between `components/` (UI only —
rendering and user interaction), `hooks/` (reusable logic, state orchestration),
`services/` (API communication only), `lib/` (stable utilities), `types/`
(interfaces/enums/models), and `contexts/` (shared app state). A layer MUST NOT
reach past its neighbor: components call hooks, hooks call services, services call
`src/lib/api.ts`. Components MUST NOT fetch data directly or contain business logic;
hooks MUST NOT render UI. This separation is what keeps the codebase navigable across
independently-evolving domains (sales, HR, loans, stock, etc.) and MUST be preserved
when adding or editing code.

### II. Service-Only Backend Access
All backend communication MUST go through `src/lib/api.ts`'s `api.get/post/put/patch/delete`
wrapper, and only from within `services/`. Services MUST return typed objects and throw
descriptive errors rather than leaking raw fetch/Response objects. No component or hook
may call `fetch` directly. This keeps auth handling (Bearer token attachment, 401
redirect-to-login) and error shaping centralized in one place instead of duplicated
per-feature.

### III. Strict TypeScript
`any` MUST NOT be used. Function parameters and return values MUST be explicitly typed.
Use `interface` for object shapes and `type` for unions. New domain models belong in
`types/<domain>.ts` and MUST be re-exported through `types/index.ts` via
`export * from './x'`, following the existing domain-slice pattern (loan, partner,
product, sale, stock, employee, journey, user). Type errors caught by
`npm run typecheck` are a merge blocker, not a suggestion.

### IV. Component Focus & Size Discipline
Components MUST have a single responsibility and primarily describe UI; when a
component grows unwieldy (~150 lines is the practical ceiling used across this
codebase), extract child components, hooks, or helper functions rather than letting it
keep growing. Business logic MUST live in hooks, not components. This keeps components
reviewable and keeps logic reusable/testable independent of rendering.

### V. Consistency Over Novelty
Prefer extending existing screens, modals, and drawers over creating new pages — a new
page is added only when explicitly requested. Reuse existing components, hooks,
services, and Tailwind styling patterns before introducing new ones; no inline styles,
no new UI libraries or design-system deviations without explicit request. Changes MUST
stay minimal and scoped to the task: do not rename files/components, reorganize
folders, or refactor unrelated code as a side effect of an unrelated change. When
requirements are ambiguous, follow the closest existing implementation rather than
inventing new UX behavior.

## Feature Documentation Convention

Feature planning artifacts (requirements/spec, plan, tasks) are produced via the
spec-kit workflow (`.specify/`), using the `speckit-specify`, `speckit-plan`, and
`speckit-tasks` commands, writing to `specs/<feature>/`. This SHOULD be followed for
non-trivial features where it aids planning and review, but it is a reusable pattern,
not a mandatory gate for every change — confirm with the user when it's unclear whether
a change warrants it. The earlier ad hoc `docs/<feature-name>/{requirements,plan,tasks}.md`
convention has been retired; do not recreate it.

## Development Workflow & Quality Gates

`npm run lint` and `npm run typecheck` MUST pass before code is considered complete.
`npm run build` MUST succeed for any change touching build configuration, dependencies,
or environment variable usage. Production code MUST NOT contain `console.log`,
`debugger` statements, or `alert` calls. Tests are supported (Vitest + Testing Library,
per `package.json`) but not required for every change; if the user asks for tests, or a
change touches an already-tested hook (`useLoans`, `useJourney`), keep the suite
runnable — note the known pre-existing gap where `vite.config.ts` references a missing
`src/test/setup.ts` (see CLAUDE.md) and fix it when it blocks requested test work rather
than leaving it silently broken.

## Governance

This constitution supersedes ad-hoc or undocumented practice for this repository.
Amendments are made by editing this file directly, updating the version per the policy
below, and syncing any dependent guidance (notably `CLAUDE.md`) in the same change so
the two documents never diverge. Versioning follows semantic rules: MAJOR for backward-
incompatible principle removals or redefinitions, MINOR for new principles or materially
expanded guidance, PATCH for wording/clarification fixes. Compliance with these
principles is expected to be checked during normal code review — no separate compliance
process is defined at this time. Day-to-day runtime development guidance (commands,
architecture detail, known issues) lives in `CLAUDE.md`; this document defines the
non-negotiable rules that guidance must stay consistent with.

**Version**: 1.1.0 | **Ratified**: 2026-07-17 | **Last Amended**: 2026-07-17
