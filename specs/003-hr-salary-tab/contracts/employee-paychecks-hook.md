# Contract: `useEmployeePaychecks` hook

This feature is frontend-only and has no new backend endpoints (see `research.md`). The
"interface contract" this feature exposes internally is the new hook's signature, which
`SalaryTab.tsx` and its children depend on. Documented here so the tasks/implementation phase
has a stable target and so tests can be written against it independent of the UI.

## Signature

```text
useEmployeePaychecks(): {
  paychecks: EmployeePaycheck[]        // see data-model.md; one entry per active employee
  month: number
  year: number
  setMonth(month: number): void
  setYear(year: number): void
  loading: boolean                     // true while (re)loading the full list for month/year
  error: boolean                       // true if the employee list or any summary call failed

  // Per-employee drill-down (User Story 2)
  getAdvancesForEmployee(employeeId: string): SalaryAdvance[] | undefined
  loadAdvancesForEmployee(employeeId: string): Promise<void>

  // Advance mutation (User Story 3) — thin wrappers that reuse employeeService and
  // refresh the affected employee's paycheck + advances on success
  createAdvance(payload: CreateSalaryAdvanceRequest): Promise<void>
  deleteAdvance(advanceId: string, employeeId: string): Promise<void>
}
```

## Behavioral contract

- On mount, and whenever `month`/`year` changes, fetches `GET /employees/?active=true` then
  `GET /employees/salary-summary/{employee_id}` for every returned employee in parallel
  (`Promise.all`), and sets `paychecks` to the zipped `EmployeePaycheck[]` (see
  `data-model.md`). Matches spec FR-002/FR-004.
- `loading` is `true` for the duration of that fetch-and-compose cycle; consumers must not
  assume `paychecks` is stale-but-present vs. fresh during `loading` — treat it as "in
  flight," matching the loading-skeleton UX approach from `plan.md`.
- `error` surfaces if either the employee list call or any per-employee summary call rejects;
  consumers show a retry affordance rather than a partial/broken table (no silent partial
  failure — this is a stricter behavior than the current `HR.tsx`, which only logs to
  console on failure).
- `getAdvancesForEmployee` returns `undefined` until `loadAdvancesForEmployee` has resolved
  for that employee at least once for the current `month`/`year`; components use this to
  distinguish "not yet loaded" from "loaded, zero advances" (`[]`), satisfying spec FR-011's
  "zero, not missing" requirement at the type level.
- `createAdvance` and `deleteAdvance` call the existing `employeeService.createSalaryAdvance`
  / `deleteSalaryAdvance` unchanged, then re-fetch that employee's summary (via the same
  per-employee `GET /employees/salary-summary/{id}` call) and advances list so `paychecks`
  and `getAdvancesForEmployee` reflect the change without a full-table reload — satisfies
  spec FR-009 ("reflect the change without requiring navigation away from the tab").

## Non-goals

- Does not introduce a WebSocket/polling live-update mechanism — spec Edge Cases explicitly
  says no live recalculation is required while the view is open; a manual refresh (re-running
  the fetch cycle) is sufficient and happens naturally on month/year change or after a
  mutation.
- Does not paginate or virtualize `paychecks` — out of scope per `research.md`'s scale
  assumption (tens of employees).
