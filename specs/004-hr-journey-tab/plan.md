# Implementation Plan: HR Journey Tab

**Branch**: `004-hr-journey-tab` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-hr-journey-tab/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Relocate the standalone "Gerenciar Jornadas" admin page into a new tab on the HR page,
alongside Funcionários, Salário, and Configuração de Atrasos — removing its separate
top-level menu entry entirely. No behavior changes to the journey-moderation feature itself
(filter, view detail/selfie, edit-with-reason, delete-with-confirmation all carry over
unmodified); this is purely a relocation, following the same "contextualize employee
features into HR" pattern already established by the Salário tab (`specs/003-hr-salary-tab`).
Per explicit user instruction, the existing "Configuração de Atrasos" tab must remain the
last tab, so the new "Jornadas" tab is inserted before it (order: Funcionários → Salário →
Jornadas → Configuração de Atrasos). Visibility is unchanged: the same `isSuperAdmin || isHR`
gate that already covers the whole HR page also covered "Gerenciar Jornadas" before this
change (both used the identical rule), so no permission logic changes at all — the gate is
simply structurally unified into one place instead of two.

## Technical Context

**Language/Version**: TypeScript 5 / React 18 (existing Vite app, no version change)

**Primary Dependencies**: React 18, Tailwind CSS, `lucide-react` (icons) — all already in
`package.json`; no new dependencies introduced

**Storage**: N/A — frontend-only feature, consumes the existing backend via `VITE_API_URL`

**Testing**: Vitest + `@testing-library/react` — `useJourney.test.ts` already exists and
covers `fetchHistory`/`registerJourney` (self-service paths); this refactor doesn't change
`useJourney.ts` at all, so no test updates are required for correctness, though the plan
allows adding coverage for the previously-untested `fetchAdminHistory`/`updateJourney`/
`deleteJourney` paths as optional polish

**Target Platform**: Web SPA (existing), responsive down to mobile viewport widths per the
rest of the app

**Project Type**: Single frontend web application (existing repo structure; no
frontend/backend split needed — backend is a separate, already-deployed service)

**Performance Goals**: No new performance targets or new network calls — the tab reuses the
exact same `useJourney`/`useLatenessConfig`/`userService` calls the standalone page already
made; only *when* they fire changes (on tab mount vs. page mount)

**Constraints**: Must preserve the layered architecture (components/hooks/services/types);
must not modify `src/services/journeyService.ts` or `src/hooks/useJourney.ts` (no backend or
data-layer changes needed — confirmed via the `api-contract-check` hook at spec time); must
follow the existing `components/HR/` subfolder convention (prop-less, default-exported,
self-contained-via-own-hooks components, per `SalaryTab.tsx` and `LatenessConfigPanel.tsx`).
**UX Approach** (per explicit request to apply UX design best practices): keep the
"configuration" tab last, a standard settings-last information-architecture convention —
the new Jornadas tab (operational/record data) sits with the other operational tabs
(Funcionários, Salário) ahead of the system-wide Configuração de Atrasos settings tab; give
the new tab its own distinct icon (`MapPin`, evoking location/check-ins) rather than reusing
the `Clock` icon already used by "Configuração de Atrasos" in the same tab bar — two adjacent
tabs sharing an icon would hurt at-a-glance scannability; preserve every existing interaction
exactly (filters, edit modal with required reason, delete confirmation, selfie viewer) since
users already know this screen — a relocation is not licence to redesign working, familiar
interactions (Constitution Principle V).

**Scale/Scope**: One component relocation plus two small wiring removals (`App.tsx`,
`Layout.tsx`); no change to the moved component's internal logic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Layered Architecture** — PASS. The moved component still only calls hooks
  (`useJourney`, `useLatenessConfig`) and one direct read from `userService` inside a
  component (pre-existing pattern in `AdminJourney.tsx`, unchanged by this move — not
  introduced by this plan, so not a new violation to fix as part of a relocation).
- **II. Service-Only Backend Access** — PASS. No changes to `journeyService.ts` or any other
  service; all backend access continues through the existing `employeeService`/
  `journeyService`/`userService` via `src/lib/api.ts`.
- **III. Strict TypeScript** — PASS. No new types are introduced; the moved component keeps
  using `JourneyResponse`, `User`, `JourneyAdminQueryParams`, `UpdateJourneyRequest` exactly
  as today, all already re-exported via `types/index.ts`.
- **IV. Component Focus & Size Discipline** — NOTED, not a new violation. The moved component
  is ~420 lines, over the ~150-line practical ceiling — but this is pre-existing size, not
  size added by this plan, and splitting it further is not required by the spec (which asks
  only for relocation, not internal restructuring). Per Principle V ("changes MUST stay
  minimal and scoped to the task... do not refactor unrelated code as a side effect"),
  breaking the component into smaller pieces is deliberately out of scope for this plan.
- **V. Consistency Over Novelty** — PASS. Reuses the `components/HR/` subfolder convention,
  the prop-less/self-contained-via-hook component shape already used by `SalaryTab.tsx` and
  `LatenessConfigPanel.tsx`, and changes zero interaction patterns inside the moved component
  — no new UI library, no redesign, just a new home and a new tab-bar icon.

No violations requiring justification — Complexity Tracking table is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/004-hr-journey-tab/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── App.tsx                              # Remove AdminJourney import + 'admin-journey' case
├── components/
│   ├── Layout.tsx                       # Remove 'admin-journey' menu item + its visibility rule
│   ├── HR.tsx                           # Add 'journey' tab (3rd, before 'lateness'), render JourneyTab
│   ├── HR/
│   │   └── JourneyTab.tsx               # New: relocated from Journey/AdminJourney.tsx, same
│   │                                     # internals, default export, no props, no logic changes
│   └── Journey/
│       ├── AdminJourney.tsx             # Removed (superseded by HR/JourneyTab.tsx)
│       ├── EmployeeJourney.tsx          # Unchanged — separate self-service page, untouched
│       └── EmployeeSalarySummary.tsx    # Unchanged
├── hooks/
│   └── useJourney.ts                    # Unchanged
├── services/
│   └── journeyService.ts                # Unchanged
└── types/
    └── journey.ts, user.ts, latenessConfig.ts  # Unchanged — no new types needed
```

**Structure Decision**: Single existing frontend project (Vite/React SPA). No new top-level
directories. The relocation follows the `components/HR/` subfolder precedent set by
`specs/003-hr-salary-tab`: `Journey/AdminJourney.tsx` becomes `HR/JourneyTab.tsx` (moved, not
copied — the old file and its wiring in `App.tsx`/`Layout.tsx` are removed so there is exactly
one way to reach journey moderation, per spec FR-001). `Journey/EmployeeJourney.tsx` (the
self-service check-in page) stays exactly where it is — it is a different feature for a
different role (EMPLOYEE) and is explicitly out of scope per the spec's Assumptions.

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
