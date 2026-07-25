# Implementation Plan: Employee Advance History View

**Branch**: `007-advance-history-modal` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-advance-history-modal/spec.md`

## Summary

Add a read-only modal showing one employee's complete, all-time salary advance history
(date, amount, note per entry, most recent first, plus a running total), opened via a new
"Ver histórico completo" entry point inside the existing "Adiantamentos do período" section
of `EmployeePaycheckDetail.tsx` — reached by expanding an employee's row on the Salário tab
(per the placement chosen with the user).

**Backend dependency — verified, not assumed**: `GET /employees/salary-advances?employee_id=
{uuid}` already exists and is used elsewhere in this domain slice; `specs/api/employees.md`
documents `month`/`year` as optional filters but doesn't explicitly state what omitting both
does for this HR-facing form (only its self-service sibling documents "omitting both returns
all of the caller's own advances"). Rather than assume symmetry, this was checked directly
against the running local backend during planning: querying with only `employee_id` (no
`month`/`year`) returned advances from multiple different months, while adding `month=7&year=
2026` scoped the same call down to just that month. **Confirmed**: omitting both filters
returns the complete history. No new or changed backend endpoint is needed for this feature.

Technical approach: extend the existing `employee` domain slice
(`services/employeeService.ts` → a new `hooks/useEmployeeAdvanceHistory.ts` →
`components/HR/EmployeeAdvanceHistoryModal.tsx`, wired in from
`components/HR/EmployeePaycheckDetail.tsx` / `EmployeePaycheckRow.tsx` / `SalaryTab.tsx`) —
no new domain, no new backend contract, no new type (the existing `SalaryAdvance` type
already matches this endpoint's list-item shape exactly, already re-verified against the live
backend's OpenAPI schema during the prior feature).

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), React 18.3

**Primary Dependencies**: Vite 5, Tailwind CSS 3, `lucide-react` icons, existing
`src/lib/api.ts` fetch wrapper — no new dependencies introduced

**Storage**: N/A — all persistent data lives in the external backend consumed via
`VITE_API_URL`

**Testing**: Vitest + `@testing-library/react`. This introduces one new hook
(`useEmployeeAdvanceHistory`) with no existing test file, so per the constitution's testing
gate a test is not mandated (not an edit to an already-tested hook) but is straightforward to
add following the `useEmployeeSchedule`/`useEmployeePaychecks.test.ts` pattern — included as a
Polish-phase task, not a blocking one.

**Target Platform**: Web SPA (existing Salário tab, desktop-oriented like the rest of the HR
module)

**Project Type**: Single frontend project (web-app). The backend is a separate, externally
owned service; no backend changes are needed for this feature (see Summary — verified live).

**Performance Goals**: No special target beyond the existing app baseline. The view must stay
usable for an employee with "a large number" of advances (spec SC-003) via a scrollable
container with a bounded modal height, not pagination — consistent with how every other list
in this app (schedule grid, sales items, etc.) handles long content.

**Constraints**: Strict layering (`components/` → `hooks/` → `services/` → `types/`), no
`any`, ~150-line practical component ceiling, read-only (spec FR-008 — no create/edit/delete
UI in this new view; those actions remain in the existing period-scoped
`EmployeePaycheckDetail` section). Must reuse the existing modal visual pattern already
established in this codebase (see Research) rather than invent a new one, per Constitution
Principle V.

**Scale/Scope**: One new hook (`useEmployeeAdvanceHistory.ts`), one restored service method
(`listSalaryAdvances`, re-added with a narrower single-employee signature — it was removed in
`006-salary-bulk-summary` for having no caller at the time), one new modal component
(`EmployeeAdvanceHistoryModal.tsx`), three small threading changes
(`SalaryTab.tsx` owns the "which employee's history is open" state;
`EmployeePaycheckRow.tsx` and `EmployeePaycheckDetail.tsx` pass an `onViewHistory` callback
through). No new types, no new top-level routes/tabs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Layered Architecture | `EmployeeAdvanceHistoryModal.tsx` calls only `useEmployeeAdvanceHistory`; the hook calls only `employeeService`; `SalaryTab.tsx`/`EmployeePaycheckRow.tsx`/`EmployeePaycheckDetail.tsx` stay presentational, threading a callback rather than fetching directly | PASS |
| II. Service-Only Backend Access | The restored `listSalaryAdvances` call is added to `employeeService.ts`, calling `api.get`; no direct `fetch` anywhere | PASS |
| III. Strict TypeScript | No new types needed — `SalaryAdvance` (already in `types/employee.ts`) matches this endpoint's list-item shape exactly (re-verified against the live backend in the prior feature); no `any` | PASS |
| IV. Component Focus & Size Discipline | New modal is its own component, not inlined into the already-nontrivial `EmployeePaycheckDetail.tsx`/`SalaryTab.tsx`; each changed file gains only a few lines (a prop + a passthrough) | PASS |
| V. Consistency Over Novelty | Reuses the exact modal visual pattern already established for read-only "view details" modals (`Reports.tsx`'s sale-details modal: header with title + `X` close button, scrollable body, `fixed inset-0` overlay) rather than inventing a new modal style; reuses the existing on-demand-fetch hook pattern already used by `useEmployeeSchedule.ts`; no new UI library | PASS |

No violations — Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-advance-history-modal/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/           # Phase 1 output
│   └── employee-advance-history.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — not created here)
```

### Source Code (repository root)

Single existing frontend project — no new top-level directories. Changed/new files only:

```text
src/
├── services/
│   └── employeeService.ts             # CHANGED — re-add listSalaryAdvances(employee_id:
│                                       #           string), narrower than the version removed
│                                       #           in 006 (no month/year — this feature always
│                                       #           wants the complete history)
├── hooks/
│   └── useEmployeeAdvanceHistory.ts   # NEW — loads one employee's complete advance list on
│                                       #       mount, sorts most-recent-first, derives the
│                                       #       running total; exposes advances, total, loading,
│                                       #       error, reload
└── components/
    └── HR/
        ├── EmployeeAdvanceHistoryModal.tsx  # NEW — read-only modal: header (employee name +
        │                                    #       X close), scrollable list (date, amount,
        │                                    #       note per entry), total, empty/error states
        ├── EmployeePaycheckDetail.tsx       # CHANGED — add a "Ver histórico completo" entry
        │                                    #           point inside the existing
        │                                    #           "Adiantamentos do período" section;
        │                                    #           new onViewHistory prop
        ├── EmployeePaycheckRow.tsx          # CHANGED — thread onViewHistory through to
        │                                    #           EmployeePaycheckDetail
        └── SalaryTab.tsx                    # CHANGED — owns the "selected employee for
                                              #           history modal" state; renders
                                              #           EmployeeAdvanceHistoryModal
                                              #           conditionally; passes onViewHistory
                                              #           down to each row
```

**Structure Decision**: Extends the existing single-project frontend layout and the existing
`employee` domain slice — no new domain, no new top-level component, no new route. Purely
additive except for the one small service-method restoration.

## Complexity Tracking

*No violations — table not needed.*
