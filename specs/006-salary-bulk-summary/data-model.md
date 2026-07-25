# Phase 1 Data Model: Salary Tab Bulk Data Loading

Frontend-side models only — the backend owns persistence. Shapes mirror the confirmed
`contracts/salary-summary-overview.md` / `specs/api/employees.md` ("Salary Summary (All
Employees)"); today's `SalarySummaryResponse` and `SalaryAdvance` types are unchanged (still
used as-is by the untouched self-service view).

## SalarySummaryOverviewAdvance (new — `types/employee.ts`)

The embedded advance shape returned inside each `SalarySummaryOverviewItem` — **narrower**
than the standalone `SalaryAdvance` type used elsewhere in this file.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `amount` | `number \| string` | |
| `advance_date` | `string \| null` | ISO date |
| `note` | `string \| null` | |

**Deliberately excludes** `employee_id` (redundant once nested under the parent item, which
already carries it), `created_at`, and `times` — all present on the standalone `SalaryAdvance`
type but absent from this embedded shape per the confirmed contract. Do **not** reuse
`SalaryAdvance` for this field — a consumer that assumes `employee_id` exists on an embedded
advance (e.g. for a delete call) will get `undefined`. See the `EmployeePaycheck.advances`
row below and `tasks.md` T013 for the concrete fix this requires.

## SalarySummaryOverviewItem (new — `types/employee.ts`)

Per-employee, per-month view, now one of many returned together instead of fetched one at a
time.

| Field | Type | Notes |
|---|---|---|
| `employee_id` | `string` | |
| `month` | `number` | resolved (possibly defaulted) month |
| `year` | `number` | resolved (possibly defaulted) year |
| `gross_salary` | `number \| string` | identical to today's `SalarySummaryResponse` field |
| `advances_total` | `number \| string` | identical to today's `SalarySummaryResponse` field |
| `late_delay_minutes` | `number` | identical to today's `SalarySummaryResponse` field |
| `late_days_count` | `number` | identical to today's `SalarySummaryResponse` field |
| `late_deduction_total` | `number \| string` | identical to today's `SalarySummaryResponse` field |
| `net_salary` | `number \| string` | `gross_salary - advances_total - late_deduction_total` |
| `advances` | `SalarySummaryOverviewAdvance[]` | this employee's advances for the period, embedded — **narrower shape**, see above, not the full `SalaryAdvance` type |

**Relationships**: One item per employee **in the system for the requested period** — the
confirmed contract does **not** filter by `active` status (inactive employees are included
too). The frontend still only cares about active employees, via the existing merge against
`getAll()`'s active filter (see `EmployeePaycheck` below) — this endpoint being broader than
"active only" doesn't require any extra frontend filtering step, since the merge already only
looks up matches for employees that survived `getAll()`'s active filter.

**Zero-value rule**: `late_delay_minutes`/`late_days_count`/`late_deduction_total` are
`0`/`0.00` when the lateness configuration is disabled or has never been created, **or when
the employee has no linked user account**.

## SalarySummaryOverviewResponse (new — `types/employee.ts`)

| Field | Type | Notes |
|---|---|---|
| `items` | `SalarySummaryOverviewItem[]` | one entry per employee in the system (active or not) for the period; mirrors `ScheduleOverviewResponse`'s existing `items` wrapper convention |

## EmployeePaycheck (changed — `types/employee.ts`)

The client-side row view model. Shape is unchanged except for where its optional fields now
come from and one added field:

| Field | Type | Notes |
|---|---|---|
| `employee_id` | `string` | from `Employee` (via `getAll()`) |
| `employee_name` | `string` | from `Employee` (via `getAll()`) |
| `base_salary` | `number \| string` | from `Employee` (via `getAll()`) |
| `month` / `year` / `gross_salary` / `advances_total` / `late_delay_minutes` / `late_days_count` / `late_deduction_total` / `net_salary` | *(unchanged types)* | **now populated from the bulk `SalarySummaryOverviewItem` merge, on the initial/period-change load** — no longer populated lazily on row expand |
| `advances` | `SalarySummaryOverviewAdvance[] \| undefined` | **NEW** — merged in directly from the matching `SalarySummaryOverviewItem.advances`; replaces the hook-level `advancesByEmployee` cache. **Note the narrower type** — no `employee_id` on each advance |

**Merge rule** (`useEmployeePaychecks.fetchPaychecks`): for each active `Employee` from
`getAll()`, look up a matching `SalarySummaryOverviewItem` by `employee_id` from the bulk
overview response (which includes inactive employees too — the lookup simply won't be used
for any `employee_id` that didn't survive `getAll()`'s active filter); if found, spread its
fields (including `advances`) onto the row; if not found (edge case — e.g. an active employee
the bulk endpoint didn't return data for), leave the summary/`advances` fields `undefined`,
and the row falls back to showing `base_salary` only, same as today's "not yet loaded" state.

**Delete-advance consequence of the narrower embedded type**: `SalaryTab.tsx`'s
`handleDeleteAdvance` currently reads `advance.employee_id` to call
`deleteAdvance(advance.id, advance.employee_id)`. Since `SalarySummaryOverviewAdvance` has no
`employee_id`, that field is `undefined` — this must instead read the **parent
`EmployeePaycheck.employee_id`**, available via closure at the row where `onDeleteAdvance` is
wired (e.g. `onDeleteAdvance={(advance) => handleDeleteAdvance(paycheck.employee_id, advance)}`,
with `handleDeleteAdvance`'s signature changed to take `employeeId` explicitly). See
`tasks.md` T013.

**State transition removed**: there is no longer a "summary not yet loaded, then loaded on
expand" transition per row — a row's summary fields are either populated by the one bulk load
for the current period, or absent because the bulk response didn't include that employee.

## SalaryAdvance (unchanged — already accurate in `types/employee.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `employee_id` | `string` | |
| `amount` | `number \| string` | |
| `advance_date` | `string \| null` | ISO date |
| `note` | `string \| null` | |
| `created_at` | `string` | ISO date |

Still the correct type for the standalone `GET /employees/salary-advances` endpoint and the
unrelated self-service salary view — **not** what arrives embedded in a
`SalarySummaryOverviewItem` (that's the narrower `SalarySummaryOverviewAdvance`, above). This
tab no longer calls the standalone endpoint or uses this type at all once T009/T010 land.

## Removed from hook state

- `advancesByEmployee: Record<string, SalaryAdvance[]>` — superseded by `EmployeePaycheck.
  advances`, populated directly in the bulk merge.
- The `getAdvancesForEmployee` accessor is removed from `useEmployeePaychecks`'s return value;
  `EmployeePaycheckRow` reads `paycheck.advances` directly instead of a hook-provided lookup.
