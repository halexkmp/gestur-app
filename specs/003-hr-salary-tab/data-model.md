# Phase 1 Data Model: HR Salary Tab

This feature introduces no backend/persisted entities — it composes existing backend
response shapes into one new client-side view model. Existing types (`Employee`,
`SalaryAdvance`, `SalarySummaryResponse`, all in `src/types/employee.ts`) are unchanged.

## New: `EmployeePaycheck` (client-side view model)

Composition of one `Employee` with its `SalarySummaryResponse` for the selected month/year.
Built by `useEmployeePaychecks` (see `contracts/employee-paychecks-hook.md`); never sent to
or received from the backend as its own shape.

```text
employee_id          # Employee.id
employee_name        # Employee.name
month                 # int — selected period, echoed from SalarySummaryResponse
year                  # int — selected period, echoed from SalarySummaryResponse
gross_salary          # from SalarySummaryResponse
advances_total        # from SalarySummaryResponse
late_delay_minutes    # from SalarySummaryResponse
late_days_count       # from SalarySummaryResponse
late_deduction_total  # from SalarySummaryResponse
net_salary             # from SalarySummaryResponse
```

**Validation / derivation rules** (mirroring spec FR-010/FR-011 and Edge Cases):

- `advances_total` and `late_deduction_total` are numeric zero (not null/undefined) when the
  employee has no advances or the lateness config is disabled/unset — the backend already
  guarantees this per `specs/api/employees.md`; the frontend must not treat zero as an error
  or loading state.
- `net_salary` is displayed as-is, including negative values (Edge Cases) — no clamping to
  zero.
- Only employees with `Employee.active === true` are included by default (spec Assumptions);
  the underlying `Employee` and `SalarySummaryResponse` are otherwise passed through
  unmodified — this view model does not recompute or override backend-provided figures.

## Reused (unchanged): `Employee`, `SalaryAdvance`, `SalarySummaryResponse`

See `src/types/employee.ts` for the authoritative shapes (already defined, already
re-exported via `src/types/index.ts`). No fields are added, removed, or reinterpreted by this
feature.

## State ownership

| State | Owner | Notes |
|---|---|---|
| `EmployeePaycheck[]` for the selected month/year | `useEmployeePaychecks` hook | Replaces the ad hoc `advances`/`summary` state currently held directly in `HR.tsx` |
| Selected month/year filter | `useEmployeePaychecks` hook | Same default (current month/year) as `useEmployeeSalarySummary` |
| Expanded employee (drill-down) | `SalaryTab` component (local UI state) | Purely presentational — which row is expanded; not fetched data |
| Itemized `SalaryAdvance[]` for the expanded employee | `useEmployeePaychecks` hook (fetched on expand, or pre-fetched per research.md scale assumptions — implementation detail for tasks phase) | Reuses `employeeService.listSalaryAdvances({ employee_id })` |
| New-advance form fields | `NewAdvanceForm` component (local UI state) | Submits via `employeeService.createSalaryAdvance`, same request shape as today |
