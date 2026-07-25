# Phase 1 Data Model: Employee Advance History View

Frontend-side models only — the backend owns persistence, and no backend or type change is
introduced by this feature (see `research.md` §2 and `contracts/employee-advance-history.md`).

## SalaryAdvance (unchanged — already accurate in `types/employee.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `employee_id` | `string` | |
| `amount` | `number \| string` | |
| `advance_date` | `string \| null` | ISO date |
| `note` | `string \| null` | |
| `created_at` | `string` | ISO date |

This is the type returned by `GET /employees/salary-advances?employee_id=...` and already
used elsewhere in this domain slice (e.g. `createSalaryAdvance`'s return type). This feature
adds no fields and no new type.

## Employee Advance History (view concept — not a new type)

Not a distinct interface — simply `SalaryAdvance[]` fetched for one `employee_id` with
`month`/`year` omitted, then:

- **Sorted** by `advance_date` descending (most recent first) — client-side, in
  `useEmployeeAdvanceHistory`, since neither this endpoint nor the bulk one documents a
  guaranteed server-side order (spec FR-003).
- **Totaled**: `advances.reduce((sum, a) => sum + Number(a.amount), 0)` — client-side, in the
  same hook, exposed as `total` alongside `advances` (spec FR-004).

## useEmployeeAdvanceHistory (new — `hooks/useEmployeeAdvanceHistory.ts`)

| Return field | Type | Notes |
|---|---|---|
| `advances` | `SalaryAdvance[]` | sorted most-recent-first; empty array (not `undefined`) before the first load resolves or when there are none |
| `total` | `number` | sum of all `advances[].amount`; `0` when `advances` is empty |
| `loading` | `boolean` | `true` while the fetch is in flight |
| `error` | `boolean` | `true` if the fetch failed |
| `reload` | `() => Promise<void>` | re-runs the fetch; used by the modal's retry button |

**Lifecycle**: takes `employeeId: string` (non-nullable — the modal that renders this hook
only ever mounts once an employee is selected, so there is no "no employee yet" state to
model, unlike `useEmployeeSchedule`'s `employeeId: string | null`). Fetches once on mount via
`useEffect`.

**Merge/derivation rule**: on successful fetch, `employeeService.listSalaryAdvances(employeeId)`
returns the raw list; the hook sorts it by `advance_date` (descending, treating a `null`
`advance_date` as oldest so it sorts last) before storing it in state, and computes `total`
from that same sorted list.

## Removed from scope

- No `EmployeePaycheck` changes — this feature reads independently of the bulk
  salary-summary-driven table state; it does not touch `useEmployeePaychecks`.
- No new type for the embedded/narrower advance shape — that already exists
  (`SalarySummaryOverviewAdvance`) for the *different*, period-scoped table view and is
  unrelated to this feature's all-time listing.
