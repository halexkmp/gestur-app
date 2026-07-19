# Phase 1 Data Model: Lateness Configuration & Employee Salary Visibility

Frontend-side models only — the backend owns persistence. Shapes mirror
`specs/api/employees.md` exactly except where noted as a proposed addition.

## LatenessConfig (new — `types/latenessConfig.ts`)

System-wide singleton; not tied to any one employee.

| Field | Type | Notes |
|---|---|---|
| `enabled` | `boolean` | Whether lateness deductions are currently applied |
| `expected_entrance_time` | `string` (`"HH:MM:SS"`) | UTC wall-clock time; may arrive with or without a trailing `Z` depending on whether a row exists yet — treat both as UTC |
| `tolerance_minutes` | `number` | `>= 0` — grace period before a check-in counts as late |
| `deduction_interval_minutes` | `number` | `> 0` — minutes of delay per deducted block |
| `deduction_value` | `number` | `>= 0` — amount deducted per full block reached |

**Validation rules** (client-side, mirrors backend `400` conditions in the contract):
- `tolerance_minutes >= 0`
- `deduction_interval_minutes > 0`
- `deduction_value >= 0`
- All five fields required together on save (`PUT` is a full replace, no partial patch)

**Lifecycle**: No creation/deletion from the frontend's perspective — `GET` always returns a
value (disabled/zeroed defaults if never configured); `PUT` creates-or-replaces the single
row. No list, no id.

**State transition**: `enabled: false → true` (or reverse) is just a field flip within the
same full-replace `PUT`; no separate enable/disable endpoint.

## SalarySummary (changed — `types/employee.ts`'s `SalarySummaryResponse`)

Per-employee, per-month view. Adding the three fields already documented in the contract but
missing from the current type.

| Field | Type | Notes |
|---|---|---|
| `employee_id` | `string` | existing |
| `month` | `number` | existing |
| `year` | `number` | existing |
| `gross_salary` | `number \| string` | existing |
| `advances_total` | `number \| string` | existing |
| `late_delay_minutes` | `number` | **NEW** — total minutes late across days beyond tolerance this month |
| `late_days_count` | `number` | **NEW** — count of days beyond tolerance this month |
| `late_deduction_total` | `number \| string` | **NEW** — total lateness deduction this month |
| `net_salary` | `number \| string` | existing — `gross_salary - advances_total - late_deduction_total` |

**Relationships**: Belongs to one `Employee` (`employee_id`); reflects the effect of the
current `LatenessConfig` on that employee's check-in history for the given month/year (via
`Journey` entries, but the frontend never computes this itself — it's a server-computed
aggregate).

**Zero-value rule**: When `LatenessConfig.enabled` is `false` or unset,
`late_delay_minutes`/`late_days_count`/`late_deduction_total` are `0`/`0.00` and `net_salary`
equals `gross_salary - advances_total` — this is a server-computed guarantee, not something
the frontend needs to special-case beyond rendering zero correctly (FR-009).

## SalaryAdvance (unchanged — already accurate in `types/employee.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `employee_id` | `string` | |
| `amount` | `number \| string` | |
| `advance_date` | `string \| null` | ISO date |
| `note` | `string \| null` | |
| `created_at` | `string` | ISO date |

Used only for the total shown in `SalarySummary.advances_total`; this feature does not add
create/delete UI for individual advances (out of scope per spec Assumptions).

## Proposed: Self-Service Access (pending backend — see `contracts/employee-self-service-salary.md`)

Not a new entity — a narrower, self-scoped read path onto `SalarySummary` above, callable by
an authenticated `EMPLOYEE` for their own record only. No new fields; see the contract file
for the exact request/response shape being proposed to the backend team.
