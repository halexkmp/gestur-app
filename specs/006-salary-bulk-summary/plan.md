# Implementation Plan: Salary Tab Bulk Data Loading

**Branch**: `006-salary-bulk-summary` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-salary-bulk-summary/spec.md`

## Summary

Replace the Salário tab's current N+1 data-loading pattern — one `GET
/employees/salary-summary/{employee_id}` call per employee (fired lazily on row expand) plus
a separate `GET /employees/salary-advances?employee_id=...` call per employee — with a single
bulk call per month/year selection that returns every employee's salary summary with their
advances embedded. This mirrors the precedent already set by `GET /employees/schedule-overview`
(see `specs/api/employees.md`, "Employee Schedule Overview (Bulk)"), which consolidated the
equivalent per-employee schedule/attendance pattern for the Work Schedule tab.

**Contract status**: `specs/api/employees.md` has been updated and now documents this bulk
endpoint for real, under "Salary Summary (All Employees)" — `GET /employees/salary-summary`
(no `-overview` suffix; the old `{employee_id}` path-param form was removed entirely, not kept
alongside a new one). Two details in the confirmed shape differ from this plan's original
proposal (`contracts/salary-summary-overview.md`, now updated to CONFIRMED status to match):
the endpoint returns **every** employee, not just active ones (the frontend's existing active
filter still has to run), and the embedded `advances` items are a **narrower** shape than the
standalone `SalaryAdvance` type (no `employee_id`, `created_at`, or `times`) — see
`data-model.md` for the concrete consequence this has for the delete-advance flow.

Technical approach: extend the existing `employee` domain slice
(`types/employee.ts` → `services/employeeService.ts` → `hooks/useEmployeePaychecks.ts` →
`components/HR/SalaryTab.tsx` / `EmployeePaycheckRow.tsx`) rather than introduce a new
domain or screen — no new tab, route, or UI is added; this is a data-loading strategy change
behind the existing Salário tab.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), React 18.3

**Primary Dependencies**: Vite 5, Tailwind CSS 3, `lucide-react` icons, existing
`src/lib/api.ts` fetch wrapper — no new dependencies introduced

**Storage**: N/A — all persistent data lives in the external backend consumed via
`VITE_API_URL`; this feature adds no new client-side persistence

**Testing**: Vitest + `@testing-library/react`. `src/hooks/useEmployeePaychecks.test.ts`
already exists and its 7 tests currently pass (`src/test/setup.ts` is present — the gap noted
in `CLAUDE.md` appears already resolved in this checkout). Every one of those 7 tests asserts
the exact lazy, per-employee behavior this feature removes (e.g. "without any salary summary
requests" on mount, "should not refetch employees when month or year changes",
`loadSummaryForEmployee`/`getAdvancesForEmployee` semantics) — per Constitution ("keep the
suite runnable" for an already-tested hook), this file MUST be rewritten alongside the hook,
not left describing a contract this feature intentionally overturns.

**Target Platform**: Web SPA (existing Salário tab, desktop-oriented like the rest of the HR
module)

**Project Type**: Single frontend project (web-app). The backend is a separate, externally
owned service — no backend code changes happen in this repo. The bulk endpoint this feature
depends on is now confirmed live in `specs/api/employees.md`; `contracts/salary-summary-overview.md`
summarizes the parts relevant to this feature's tasks.

**Performance Goals**: Data-loading operations for the Salário tab's selected period MUST NOT
scale with the number of active employees (spec SC-002) — one combined load per period
selection, replacing what is today up to `1 + 2N` requests (employee list + summary and
advances per expanded employee) with `2` requests (employee list + bulk overview), matching
the request-count reduction already achieved for the Work Schedule tab
(`useWorkSchedule.ts`'s comment: "Replaces what used to be up to 3 requests per employee").

**Constraints**: Strict layering (`components/` → `hooks/` → `services/` → `types/`), no
`any`, ~150-line practical component ceiling. Must preserve every existing salary summary
figure exactly as currently defined (spec FR-008) — the confirmed contract does this for
summary fields. It does **not** do this verbatim for advance fields (see Summary above): the
embedded advance shape drops `employee_id`/`created_at`/`times` versus the standalone
`SalaryAdvance` type, so the delete-advance call site must be adjusted to source `employee_id`
from the parent item instead of the advance itself — a deliberate, documented exception to
FR-008's "no data redesign" intent, not an oversight (see `data-model.md`, `tasks.md` T013).

**Scale/Scope**: One changed hook (`useEmployeePaychecks.ts`), one changed service
(`employeeService.ts`), one changed type file (`types/employee.ts`), three changed components
(`SalaryTab.tsx` — logic simplification plus the delete-advance employee-id fix;
`EmployeePaycheckRow.tsx` / `EmployeePaycheckDetail.tsx` — type-only change, swapping their
`advances`/`onDeleteAdvance` prop type from `SalaryAdvance` to the new narrower
`SalarySummaryOverviewAdvance`). No new routes, tabs, or top-level components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Layered Architecture | `SalaryTab.tsx` keeps calling only `useEmployeePaychecks`; the hook keeps calling only `employeeService`; no component fetches directly | PASS |
| II. Service-Only Backend Access | The new bulk call is added to `employeeService.ts` as `getSalarySummaryOverview`, calling `api.get`, mirroring `getScheduleOverview` exactly; no direct `fetch` anywhere | PASS |
| III. Strict TypeScript | New `SalarySummaryOverviewAdvance` / `SalarySummaryOverviewItem` / `SalarySummaryOverviewResponse` types added to `types/employee.ts`, re-exported via the existing `export * from './employee'` in `types/index.ts`; no `any`; the narrower embedded-advance type is modeled explicitly rather than loosely reusing `SalaryAdvance` | PASS |
| IV. Component Focus & Size Discipline | `SalaryTab.tsx` and `useEmployeePaychecks.ts` both get **smaller** — the lazy-load-on-expand branches, the period-change cache-invalidation effect, and the expanded-row re-fetch effect are all removed since data arrives already-loaded | PASS |
| V. Consistency Over Novelty | Reuses the exact bulk-overview pattern already established by `getScheduleOverview` / `useWorkSchedule.ts` (`Promise.all([getAll(), getXOverview(...)])`, merge by `employee_id`); no new UI, no new endpoint-design idiom | PASS |

No violations — Complexity Tracking table not needed.

**Risk resolved**: the bulk endpoint dependency this section originally carried forward
(backend hadn't shipped `GET /employees/salary-summary-overview` yet) is resolved —
`specs/api/employees.md` now documents the real, confirmed endpoint (`GET
/employees/salary-summary`, no path param). `quickstart.md`'s scenarios are no longer blocked
on backend delivery in principle, only on having a running instance available to test
against. The two corrections this confirmation surfaced (all-employees scope, narrower
embedded advance shape) are folded into `data-model.md`, `research.md`, and `tasks.md`
directly rather than tracked here as an open risk.

## Project Structure

### Documentation (this feature)

```text
specs/006-salary-bulk-summary/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── salary-summary-overview.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — not created here)
```

### Source Code (repository root)

Single existing frontend project — no new top-level directories. Changed files only:

```text
src/
├── types/
│   └── employee.ts              # CHANGED — add SalarySummaryOverviewAdvance (narrower than
│                                 #           SalaryAdvance — no employee_id/created_at/times),
│                                 #           SalarySummaryOverviewItem, SalarySummaryOverview
│                                 #           Response; EmployeePaycheck gains an `advances`
│                                 #           field typed SalarySummaryOverviewAdvance[]
├── services/
│   └── employeeService.ts       # CHANGED — add getSalarySummaryOverview(params?: {month,
│                                 #           year}) calling GET /employees/salary-summary (no
│                                 #           path param, no "-overview" suffix); remove
│                                 #           getSalarySummary (its underlying per-employee
│                                 #           endpoint no longer exists) and listSalaryAdvances
│                                 #           (no remaining caller once this tab stops using it)
├── hooks/
│   └── useEmployeePaychecks.ts  # CHANGED — fetchPaychecks now depends on [month, year] and
│                                 #           calls Promise.all([getAll(), getSalarySummary
│                                 #           Overview({month, year})]), merging only against
│                                 #           getAll()'s active-filtered employees (the overview
│                                 #           response itself includes inactive employees too);
│                                 #           loadAdvancesForEmployee / refreshEmployee /
│                                 #           loadSummaryForEmployee (lazy per-employee loaders)
│                                 #           are removed; createAdvance / deleteAdvance re-run
│                                 #           fetchPaychecks() instead of targeted per-employee
│                                 #           refreshes
└── components/
    └── HR/
        ├── SalaryTab.tsx            # CHANGED — toggleRow no longer conditionally fetches; the
        │                            #           period-change re-fetch effect added in the
        │                            #           prior bugfix is removed (fetchPaychecks
        │                            #           already reruns on [month, year] inside the
        │                            #           hook); handleDeleteAdvance's signature gains
        │                            #           an explicit employeeId param, sourced from the
        │                            #           parent paycheck rather than the embedded
        │                            #           advance (which has no employee_id)
        ├── EmployeePaycheckRow.tsx    # CHANGED — advances/onDeleteAdvance prop types swap from
        │                            #           SalaryAdvance to SalarySummaryOverviewAdvance
        │                            #           (type-only change)
        └── EmployeePaycheckDetail.tsx # CHANGED — same type-only prop swap
```

**Structure Decision**: Extends the existing single-project frontend layout and the existing
`employee` domain slice — no new domain, no new top-level component, no new route. This is a
data-loading rewrite entirely internal to files that already exist.

## Complexity Tracking

*No violations — table not needed.*
