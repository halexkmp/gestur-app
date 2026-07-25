# Contract: Salary Summary (Bulk)

Status: **CONFIRMED — implemented by the backend.** `specs/api/employees.md`'s "Salary
Summary (All Employees)" section is now the authoritative, hand-verified source for this
endpoint. This file summarizes the parts of that contract relevant to this feature's
implementation tasks; if the two ever disagree, `specs/api/employees.md` wins.

## Why this was needed

Before this endpoint existed, viewing every active employee's salary summary for a period
required `GET /employees/salary-summary/{employee_id}?month&year` once per employee, plus
`GET /employees/salary-advances?employee_id&month&year` once per employee to see their
advances — an `N`-employee tab cost up to `2N` requests once every row had been expanded. The
backend replaced both with a single bulk call per month/year selection, the same class of
consolidation `GET /employees/schedule-overview` already provides for the Work Schedule tab.

## Endpoint

```text
GET /employees/salary-summary?month={int}&year={int}
```

**Note the path**: this reuses the endpoint's original path — it does **not** add a new
`-overview`-suffixed sibling route. The old `{employee_id}` path-param, single-employee form
has been removed entirely; `employee_id` is not accepted on this endpoint in any form.
(An earlier draft of this contract proposed a new `/employees/salary-summary-overview` path
before the backend confirmed its actual shape — that name never shipped; don't reintroduce it.)

Requires: `HUMAN_RESOURCES` — the one endpoint in `specs/api/employees.md` in this section of
the file where `ADMIN` is **not** also granted, unlike the schedule/absence/attendance/overview
endpoints.

- `month` / `year` (optional): default to the current month/year.
- No `employee_id` or `employee_ids` param.

## Response

```text
items: [
  {
    employee_id
    month                     # int — resolved (possibly defaulted) month
    year                      # int — resolved (possibly defaulted) year
    gross_salary
    advances_total
    advances: [
      {
        id
        amount
        advance_date
        note                  # nullable
      },
      ...
    ]
    late_delay_minutes        # total minutes late across days beyond tolerance this month
    late_days_count           # count of days beyond tolerance this month
    late_deduction_total      # total lateness deduction this month
    net_salary                # gross_salary - advances_total - late_deduction_total
  },
  ...
]
```

- **Scope — all employees, not just active**: one entry per employee **in the system**,
  "not filtered by `active` status — inactive employees are included," in a stable but
  unspecified order. This tab has never shown inactive employees, so the frontend still needs
  its own active filter — see "Frontend consumption" below. (An earlier draft of this
  contract assumed the endpoint itself would omit inactive employees, mirroring
  `schedule-overview`'s "no schedule ⇒ omitted" behavior. That assumption was wrong; corrected
  here.)
- No employees in the system → `items: []` (not an error).
- **`advances` shape is narrower than the standalone `SalaryAdvance` type**: only `id, amount,
  advance_date, note` — **no `employee_id`, no `created_at`, no `times`**. `employee_id` is
  redundant once nested under the parent item (which already carries it), but this means code
  consuming an embedded advance cannot read `advance.employee_id` — it must use the parent
  item's `employee_id` instead. (An earlier draft of this contract assumed the embedded shape
  would exactly match `SalaryAdvance`; corrected here — see "Frontend consumption.")
- `advances` is the itemized list of that employee's advances with `advance_date` in the
  requested month/year; `advances_total` always equals the sum of `advances[].amount`. An
  employee with no advances that period has `advances: []` and `advances_total: "0.00"`.
- `late_delay_minutes`, `late_days_count`, and `late_deduction_total` are `0`/`0.00` when the
  lateness configuration is disabled or has never been created, **or when the employee has no
  linked user account**; `net_salary` is then numerically identical to
  `gross_salary - advances_total`.

## Frontend consumption

- `services/employeeService.ts`'s `getSalarySummaryOverview(params?: {month, year})` calls
  `GET /employees/salary-summary` (not `-overview` — see "Endpoint" above).
- `types/employee.ts` models the embedded advance as a distinct, narrower
  `SalarySummaryOverviewAdvance` type (`id, amount, advance_date, note`), **not** the existing
  `SalaryAdvance` type — reusing `SalaryAdvance` would incorrectly imply `employee_id`/
  `created_at`/`times` are present on the embedded item.
- `hooks/useEmployeePaychecks.ts`'s `fetchPaychecks` calls this alongside the existing
  `employeeService.getAll()` via `Promise.all`, merges by `employee_id` **against the
  already-active-filtered employee list** (the overview response itself includes inactive
  employees too, but the merge only looks up matches for employees `getAll()` + the active
  filter already kept), and re-runs whenever `month`/`year` change (see `data-model.md` and
  `research.md` §3–§5).
- Because the embedded advance has no `employee_id`, the delete-advance call site
  (`SalaryTab.tsx`) must use the **parent paycheck's `employee_id`**, not
  `advance.employee_id` — see `data-model.md`'s merge rule and `tasks.md` T013.
- If the call fails, the tab shows the existing single error state with a retry button (spec
  FR-006) — no per-row error handling is needed since there is only one request to fail.
