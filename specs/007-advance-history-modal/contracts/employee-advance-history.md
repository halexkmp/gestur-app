# Contract: Employee Advance History

Status: **CONFIRMED — already implemented and already documented.** Unlike
`006-salary-bulk-summary`, this feature introduces no new backend behavior; this file exists
only to record how this feature relies on the existing `GET /employees/salary-advances`
endpoint and to capture the live verification performed during planning.

## Endpoint used

```text
GET /employees/salary-advances?employee_id={uuid}
```

Documented in `specs/api/employees.md` under "Salary Advance" — `month`/`year` are also
accepted but are **intentionally not passed** by this feature, since the goal is always the
complete history, not a period-scoped one.

Requires: `HUMAN_RESOURCES` (unchanged — same as every other endpoint in this file's HR-facing
section).

## Response (unchanged from the documented contract)

```text
[
  {
    id
    employee_id
    amount
    advance_date
    note        # nullable
    created_at
  },
  ...
]
```

Matches the existing `SalaryAdvance` type in `types/employee.ts` exactly — no type changes
needed.

## Live verification performed during planning (2026-07-25)

Against the local backend (`localhost:8000`), for an employee who already had one advance
dated in July 2026:

1. Created a second advance for the same employee dated `2026-03-15`.
2. `GET /employees/salary-advances?employee_id={id}` (no `month`/`year`) → returned **both**
   the March and July advances.
3. `GET /employees/salary-advances?employee_id={id}&month=7&year=2026` → returned **only**
   the July advance.
4. Deleted the test (March) advance to leave the dataset unchanged.

This confirms omitting `month`/`year` returns the employee's complete advance history, not a
current-month default — the assumption this feature depends on is verified, not inferred.

## Frontend consumption

- `services/employeeService.ts` re-adds `listSalaryAdvances(employee_id: string) =>
  api.get<SalaryAdvance[]>('/employees/salary-advances', { params: { employee_id } })` —
  narrower than the version removed in `006-salary-bulk-summary` (that version also accepted
  `month`/`year`, which this feature never needs, so they're dropped rather than carried
  forward unused).
- `hooks/useEmployeeAdvanceHistory.ts` calls this on mount for a given `employeeId`, sorts the
  result by `advance_date` descending, and derives the total.
- No error-shape changes: a failure surfaces the same way `api.ts` already surfaces every
  other failure (thrown `ApiError`/`Error`), handled by the hook's existing catch pattern.
