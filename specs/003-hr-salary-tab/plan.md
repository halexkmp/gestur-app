# Implementation Plan: HR Salary Tab

**Branch**: `003-hr-salary-tab` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-hr-salary-tab/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Rename the HR "Adiantamentos" tab to "Salário" and recontextualize it around a per-employee
current paycheck: a default table of every active employee's gross salary, salary-advance
discount, lateness discount, and net salary for the selected month/year, with a per-employee
drill-down for itemized advances and lateness detail, and the existing add/delete-advance
capability preserved. No backend changes: the existing `GET /employees/salary-summary/{id}`
and `GET /employees/salary-advances` endpoints already return every figure needed (confirmed
via the `api-contract-check` hook at spec time). The work is a frontend-only refactor of
`HR.tsx`'s advances tab, following the visual/data pattern already established by
`EmployeeSalarySummary.tsx` / `useEmployeeSalarySummary.ts` (the employee self-service
"Meu Salário" card), extended from a single employee to a list, per Constitution Principle V
(Consistency Over Novelty). User explicitly asked this be implemented with UX design best
practices — see the UX Approach note under Constraints and the `research.md` decision log.

## Technical Context

**Language/Version**: TypeScript 5 / React 18 (existing Vite app, no version change)

**Primary Dependencies**: React 18, Tailwind CSS, `lucide-react` (icons) — all already in
`package.json`; no new dependencies introduced

**Storage**: N/A — frontend-only feature, consumes the existing backend via `VITE_API_URL`

**Testing**: Vitest + `@testing-library/react`, following the existing `useLoans.test.ts` /
`useJourney.test.ts` hook-test convention

**Target Platform**: Web SPA (existing), responsive down to mobile viewport widths per the
rest of the app

**Project Type**: Single frontend web application (existing repo structure; no
frontend/backend split needed — backend is a separate, already-deployed service)

**Performance Goals**: No new performance targets; the paycheck table issues one
`GET /employees/salary-summary/{id}` call per active employee in parallel (`Promise.all`),
acceptable for the app's typical employee-roster sizes (tens, not thousands) — see
`research.md` for the rejected batch-endpoint alternative

**Constraints**: Must preserve the layered architecture (components/hooks/services/types);
must reuse `employeeService` as-is (no new API endpoints, since the backend contract already
covers every figure required); must follow existing Tailwind styling and the card visual
language already established in `EmployeeSalarySummary.tsx`; no new UI libraries. **UX
Approach** (per explicit request to apply UX design best practices): default to an
at-a-glance table (not a form-first screen) so HR sees every employee's paycheck with zero
interaction beyond opening the tab (spec SC-001); keep the "new advance" action as a clearly
labeled, deliberately secondary entry point (button → inline row/panel) rather than an
always-open form competing with the paycheck table for attention; use progressive disclosure
(expand/drawer per employee row) for the advances + lateness itemization so the default view
stays scannable; reuse the existing green/orange/red color coding (net/advances/lateness)
for consistent meaning across the app; provide loading skeletons and explicit zero-states
(not blank cells) for employees with no advances or no lateness deduction, per spec FR-010/011;
ensure the table collapses to stacked cards on narrow viewports, consistent with the existing
employee table's `overflow-x-auto` pattern.

**Scale/Scope**: One component-level refactor inside the existing HR page; typical
deployments have on the order of tens of active employees per company

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Layered Architecture** — PASS (by design). Today `HR.tsx` fetches data and holds
  advance/summary state directly in the component, which already strains this principle.
  This refactor extracts a new hook (`useEmployeePaychecks`, see Phase 1) to own the
  fetch-and-compose logic, so components go back to being render-only.
- **II. Service-Only Backend Access** — PASS. No new endpoints; the hook calls only existing
  `employeeService` methods (`getAll`, `getSalarySummary`, `listSalaryAdvances`,
  `createSalaryAdvance`, `deleteSalaryAdvance`). No component/hook calls `fetch` directly.
- **III. Strict TypeScript** — PASS. Reuses existing `Employee`, `SalaryAdvance`,
  `SalarySummaryResponse` types; the one new type (`EmployeePaycheck`, a client-side
  composition) goes in `types/employee.ts` and is re-exported via `types/index.ts`, no `any`.
- **IV. Component Focus & Size Discipline** — PASS (by design). `HR.tsx` is currently 507
  lines, already over the ~150-line practical ceiling. This refactor splits the advances/
  salary tab out of `HR.tsx` into dedicated components (paycheck table, row, drill-down
  panel, new-advance form) instead of adding more inline JSX to the existing file.
- **V. Consistency Over Novelty** — PASS. Reuses the card layout, copy conventions (pt-BR
  labels, `R$` formatting), and color semantics already shipped in
  `EmployeeSalarySummary.tsx`; no new page is added (still the same HR page, same tab
  position); no new UI library or design pattern introduced for the "UX best practices"
  request — best practice here is applying progressive disclosure and clear default state
  using components/patterns the app already has.

No violations requiring justification — Complexity Tracking table is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/003-hr-salary-tab/
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
├── components/
│   ├── HR.tsx                          # Tab shell — trimmed to route between
│   │                                    # Employees / Salário / Lateness tabs
│   └── HR/
│       ├── SalaryTab.tsx                # New: default paycheck table + month/year filter
│       ├── EmployeePaycheckRow.tsx      # New: one employee's summary row + expand toggle
│       ├── EmployeePaycheckDetail.tsx   # New: itemized advances + lateness detail (expanded)
│       └── NewAdvanceForm.tsx           # New: extracted from HR.tsx's inline advance form
├── hooks/
│   ├── useEmployeePaychecks.ts          # New: fetches employees + per-employee salary
│   │                                    # summaries for a month/year, composes EmployeePaycheck[]
│   └── useEmployeePaychecks.test.ts     # New: mirrors useLoans.test.ts conventions
├── services/
│   └── employeeService.ts               # Unchanged — existing methods reused as-is
└── types/
    ├── employee.ts                      # Add EmployeePaycheck view-model type
    └── index.ts                         # Unchanged — already re-exports via `export * from './employee'`
```

**Structure Decision**: Single existing frontend project (Vite/React SPA). No new top-level
directories. `HR.tsx` is split so the renamed "Salário" tab's markup and state move into a
`components/HR/` subfolder (new; mirrors the existing `components/Journey/` subfolder
pattern) instead of growing the already-oversized `HR.tsx` further, and its fetch/compose
logic moves into a new `useEmployeePaychecks` hook — bringing the tab back in line with
Constitution Principle I (components render, hooks orchestrate) and Principle IV (component
size discipline).

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
