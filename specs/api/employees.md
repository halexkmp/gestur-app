# Employees API

Requires: HUMAN_RESOURCES on every endpoint in this file, **except**:

- `GET /employees/me/salary-summary` and `GET /employees/me/salary-advances`, which instead
  require the EMPLOYEE role plus a linked employee record on the caller's own account (see
  "Employee Self-Service" below).
- `GET /employees/me/schedule`, same EMPLOYEE-role-plus-linked-record requirement (see
  "Employee Self-Service" below).
- The Employee Weekly Schedule / Justified Absence / Attendance Verification / Schedule
  Overview endpoints (see their sections below), which require HUMAN_RESOURCES **or**
  ADMIN — the only endpoints in this file where ADMIN is also granted access alongside HR.

## Endpoints

GET /employees/?active={bool}

POST /employees/

GET /employees/{employee_id}

PUT /employees/{employee_id}

DELETE /employees/{employee_id} → 204

GET /employees/salary-summary?month={int}&year={int}

GET /employees/salary-advances?employee_id={uuid}&month={int}&year={int}

POST /employees/salary-advances → 201, returns no body

DELETE /employees/salary-advances/{advance_id} → 204

GET /employees/lateness-config

PUT /employees/lateness-config

GET /employees/me/salary-summary?month={int}&year={int}

GET /employees/me/salary-advances?month={int}&year={int}

GET /employees/schedule/{employee_id}

PUT /employees/schedule/{employee_id}

GET /employees/me/schedule

POST /employees/justified-absences → 201, returns no body

GET /employees/justified-absences?employee_id={uuid}&month={int}&year={int}

DELETE /employees/justified-absences/{absence_id} → 204

GET /employees/attendance-verification/{employee_id}?month={int}&year={int}

GET /employees/schedule-overview?employee_ids={uuid}&month={int}&year={int}

All query params above are optional filters.

---

## Employee

```text
id
name
salary
pix_key    # nullable
active
start_date
user_id    # nullable — id of the linked User account, or null if none
```

Create request: `name, pix_key?, salary (>=0), active (default true), start_date, user_id?`.

- `user_id` is optional. If supplied, it must reference an existing user account that is
  not already linked to a different employee.
- Referencing a `user_id` that doesn't exist → `404 Not Found`.
- Referencing a `user_id` already linked to a different employee → `400 Bad Request`.

Update request (PUT, partial): all fields optional, including `user_id`.

- Omitting `user_id` leaves the employee's current linked user unchanged.
- Sending `"user_id": "<uuid>"` sets or changes the linked user.
- Sending `"user_id": null` explicitly clears the linked user.
- Referencing a `user_id` that doesn't exist → `404 Not Found`.
- Referencing a `user_id` already linked to a different employee → `400 Bad Request`.

---

## Salary Advance

Create request (POST /employees/salary-advances):

```text
employee_id
amount        # decimal > 0
advance_date
note          # nullable
times         # int > 0 — splits amount into `times` separate monthly advance records
```

Note: this endpoint returns 201 with an empty body — the created record(s) are not echoed
back. To see them, use GET /employees/salary-advances.

List item (GET /employees/salary-advances response):

```text
id
employee_id
amount
advance_date
note        # nullable
created_at
```

---

## Lateness Configuration

Single, system-wide configuration governing late-arrival salary deductions.

```text
enabled                        # bool
expected_entrance_time         # time, "HH:MM:SS"
tolerance_minutes              # int >= 0 — grace period before a check-in counts as late
deduction_interval_minutes     # int > 0 — minutes of delay per deducted block
deduction_value                # decimal >= 0 — amount deducted per full block reached
```

GET /employees/lateness-config: returns the values above. If no configuration has ever
been created, returns disabled/all-zero defaults (`enabled: false`, `expected_entrance_time:
"00:00:00"`, all numeric fields `0`/`0.00`) rather than `404`.

- Quirk: `expected_entrance_time` is stored as UTC and serializes with a trailing `Z`
  (e.g. `"08:00:00Z"`) once a real row exists, but as a bare `"00:00:00"` (no offset) in
  the no-row default case above. Treat both as UTC wall-clock time-of-day.

PUT /employees/lateness-config: full replace — all five fields are required on every call
(no partial patch). Creates the singleton row if none exists yet, otherwise updates the
existing one in place. Response: same shape as GET.

- `expected_entrance_time` may be submitted as a bare time (`"08:00:00"`, assumed UTC) or
  with an explicit UTC offset (`"08:00:00-03:00"`, `"08:00:00Z"`); any offset is converted
  to true UTC before being stored, so `"08:00:00-03:00"` is stored/interpreted as
  `11:00:00` UTC, not as a bare `08:00` with the offset discarded.

- `tolerance_minutes < 0`, `deduction_interval_minutes <= 0`, or `deduction_value < 0` →
  `400 Bad Request`.

Deduction formula for a day where the employee's earliest check-in is later than
`expected_entrance_time` by more than `tolerance_minutes`:
`floor(delay_minutes / deduction_interval_minutes) * deduction_value`, where `delay_minutes`
is measured from `expected_entrance_time` (not reduced by the tolerance). When disabled,
no deduction is applied and salary summaries report zero delay/deduction.

---

## Salary Summary (All Employees)

GET /employees/salary-summary response:

```text
items: [
  {
    employee_id
    month
    year
    gross_salary
    advances_total
    advances: [
      {
        id
        amount
        advance_date
        note          # nullable
      },
      ...
    ]
    late_delay_minutes     # total minutes late across days beyond tolerance this month
    late_days_count        # count of days beyond tolerance this month
    late_deduction_total   # total lateness deduction this month
    net_salary              # gross_salary - advances_total - late_deduction_total
  },
  ...
]
```

- One entry per employee in the system, in a stable but unspecified order. Employees are
  **not** filtered by `active` status — inactive employees are included.
- `month`/`year` (optional query params): default to the current month/year.
- No employees in the system → `items: []` (not an error).
- `advances` is the itemized list of that employee's `SalaryAdvance` records with
  `advance_date` in the requested month/year; `advances_total` always equals the sum of
  `advances[].amount`. An employee with no advances that month/year has `advances: []` and
  `advances_total: "0.00"`.
- `late_delay_minutes`, `late_days_count`, and `late_deduction_total` are `0`/`0.00` when the
  lateness configuration is disabled or has never been created, or when the employee has no
  linked user account; `net_salary` is then numerically identical to
  `gross_salary - advances_total`.
- Requires HUMAN_RESOURCES (unchanged from before this endpoint became bulk — note this is
  the one exception in this file where ADMIN is *not* also granted, unlike the schedule/
  absence/attendance/overview endpoints below).
- This previously took `{employee_id}` as a path parameter and returned a single object; that
  form no longer exists — `employee_id` is not accepted on this endpoint at all.

---

## Employee Self-Service

Requires: EMPLOYEE role AND a linked employee record on the caller's own `User` account
(the existing one-to-one `Employee.user` link) — not HUMAN_RESOURCES. Neither endpoint
below accepts an `employee_id` parameter of any kind; the target employee is always the
caller, resolved server-side from the authenticated token. A caller with the EMPLOYEE role
but no linked employee record, or a caller without the EMPLOYEE role (even one who has a
linked employee record, e.g. an HR user who is also on payroll), gets `403 Forbidden` from
both endpoints.

### GET /employees/me/salary-summary

Self-service equivalent of `GET /employees/salary-summary`, scoped to the caller. Returns a
single object with the same per-employee fields as one item of the bulk endpoint above
(`employee_id`, `month`, `year`, `gross_salary`, `advances_total`, `late_delay_minutes`,
`late_days_count`, `late_deduction_total`, `net_salary`) — not the `items` wrapper, and
without the itemized `advances` array (that field is specific to the HR-facing bulk report).
`month`/`year` are optional and default to the current month, same as the HR-facing
endpoint.

### GET /employees/me/salary-advances

Self-service equivalent of `GET /employees/salary-advances?employee_id=...`, scoped to the
caller. Same response item shape as that endpoint (see "Salary Advance" above). `month`/`year`
are optional filters; omitting both returns all of the caller's own advances.

### GET /employees/me/schedule

Self-service equivalent of `GET /employees/schedule/{employee_id}`, scoped to the caller (no
`employee_id` param accepted — resolved server-side from the token). Same response shape and
same 404-if-no-schedule behavior as the HR-facing endpoint (see "Employee Weekly Schedule"
below).

---

## Employee Weekly Schedule

Requires: HUMAN_RESOURCES **or** ADMIN (except the self-service `GET /employees/me/schedule`
above, which requires EMPLOYEE + linked record).

```text
employee_id
monday      # bool
tuesday     # bool
wednesday   # bool
thursday    # bool
friday      # bool
saturday    # bool
sunday      # bool
```

GET /employees/schedule/{employee_id}: returns the shape above.

- No schedule has ever been set for that employee → `404 Not Found` (there is no
  all-working/all-off default to fall back to — absence of a schedule is a distinct,
  meaningful state).
- `employee_id` doesn't reference an existing employee → `404 Not Found`.

PUT /employees/schedule/{employee_id}: full replace — all 7 day flags are required on every
call (no partial patch, consistent with `PUT /employees/lateness-config`). Creates the row if
none exists yet, otherwise replaces the 7 flags on the existing row. Response: same shape as
GET.

- `employee_id` doesn't reference an existing employee → `404 Not Found`.

---

## Justified Absence

Requires: HUMAN_RESOURCES **or** ADMIN.

Create request (POST /employees/justified-absences):

```text
employee_id
absence_date
reason         # nullable
```

- `absence_date` must be one of the employee's scheduled work days per their current
  Employee Weekly Schedule → otherwise `400 Bad Request`.
- Employee has no Employee Weekly Schedule at all → `400 Bad Request` (no scheduled work
  days exist to justify an absence against).
- A justified absence already exists for this `employee_id` + `absence_date` →
  `400 Bad Request`.
- `employee_id` doesn't reference an existing employee → `404 Not Found`.
- Returns `201` with no body — the created record is not echoed back. To see it, use
  GET /employees/justified-absences.

List item (GET /employees/justified-absences response):

```text
id
employee_id
absence_date
reason        # nullable
created_at
```

DELETE /employees/justified-absences/{absence_id} → `204 No Content`.

- `absence_id` doesn't reference an existing justified absence → `404 Not Found`.

---

## Attendance Verification

Requires: HUMAN_RESOURCES **or** ADMIN.

GET /employees/attendance-verification/{employee_id} response:

```text
employee_id
month
year
days: [
  {
    date
    status                    # PRESENT | JUSTIFIED_ABSENCE | UNJUSTIFIED_ABSENCE
  },
  ...
]
unjustified_absence_count      # count of days where status == UNJUSTIFIED_ABSENCE
```

- `days` only includes dates that are scheduled work days per the employee's Employee
  Weekly Schedule, within the requested month/year, and within the employee's active
  employment period. Non-working days per the schedule never appear in `days`.
- A justified absence takes priority over presence: a date with both a journey register
  and a justified absence is reported as `JUSTIFIED_ABSENCE`, not `PRESENT`.
- Employee has no Employee Weekly Schedule at all → `days: []`,
  `unjustified_absence_count: 0` — not a `404`, since "no schedule" is a valid, reportable
  state (nothing was expected, so nothing is missing).
- Employee has no linked user account → `days: []`, `unjustified_absence_count: 0` —
  presence can never be determined without a linked account, so this reports as "no data,"
  not as every day being an unjustified absence.
- Employee is currently inactive (`active: false`) → `days: []`,
  `unjustified_absence_count: 0` for the **entire** requested period. There is no
  deactivation timestamp on `Employee`, only the current flag, so this endpoint cannot
  clip to the exact date an employee became inactive — the whole period is excluded once
  inactive, which may under-report absences that occurred while still active in a period
  that also includes the deactivation.
- `employee_id` doesn't reference an existing employee → `404 Not Found`.
- This endpoint performs no write and triggers no salary/payroll recalculation — it is
  read-only.

---

## Employee Schedule Overview (Bulk)

Requires: HUMAN_RESOURCES **or** ADMIN.

Consolidates `GET /employees/schedule/{employee_id}` and
`GET /employees/attendance-verification/{employee_id}?month&year` for many employees into a
single call, so a caller building a schedule/attendance view for many employees does not need
to issue two requests per employee.

GET /employees/schedule-overview response:

```text
items: [
  {
    employee_id
    monday                      # bool
    tuesday                     # bool
    wednesday                   # bool
    thursday                    # bool
    friday                      # bool
    saturday                    # bool
    sunday                      # bool
    month                       # int — resolved (possibly defaulted) month
    year                        # int — resolved (possibly defaulted) year
    days: [
      {
        date
        status                 # PRESENT | JUSTIFIED_ABSENCE | UNJUSTIFIED_ABSENCE
      },
      ...
    ]
    unjustified_absence_count   # count of days where status == UNJUSTIFIED_ABSENCE
  },
  ...
]
```

- `employee_ids` (optional, repeatable query param): scopes the result to specific employees.
  Omitted or empty → all employees are considered.
- `month` / `year` (optional): default to the current month/year, same as
  `GET /employees/attendance-verification/{employee_id}`.
- One entry per considered employee that has an Employee Weekly Schedule. Employees with no
  schedule are omitted entirely from `items` — there is no per-employee `404` here, since the
  request spans many employees; an empty `items: []` is a valid response, not an error.
- An `employee_ids` value that doesn't reference an existing employee, or references an
  employee with no schedule, is silently skipped — it does not fail the request for the other
  requested employees.
- The `monday`..`sunday` flags and the `days`/`unjustified_absence_count` values for each
  employee are identical to what the two single-employee endpoints above would return for
  that employee and period, including all of their documented edge-case rules (no linked user
  account, inactive employee, period clipped to `start_date`/today, justified-absence-takes-
  priority-over-presence).
- This endpoint does not replace `GET /employees/schedule/{employee_id}` or
  `GET /employees/attendance-verification/{employee_id}` — both continue to work unchanged.