# Employees API

Requires: HUMAN_RESOURCES on every endpoint in this file, **except** `GET /employees/me/salary-summary`
and `GET /employees/me/salary-advances`, which instead require the EMPLOYEE role plus a
linked employee record on the caller's own account (see "Employee Self-Service" below).

## Endpoints

GET /employees/?active={bool}

POST /employees/

GET /employees/{employee_id}

PUT /employees/{employee_id}

DELETE /employees/{employee_id} → 204

GET /employees/salary-summary/{employee_id}?month={int}&year={int}

GET /employees/salary-advances?employee_id={uuid}&month={int}&year={int}

POST /employees/salary-advances → 201, returns no body

DELETE /employees/salary-advances/{advance_id} → 204

GET /employees/lateness-config

PUT /employees/lateness-config

GET /employees/me/salary-summary?month={int}&year={int}

GET /employees/me/salary-advances?month={int}&year={int}

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

## Salary Summary

GET /employees/salary-summary/{employee_id} response:

```text
employee_id
month
year
gross_salary
advances_total
late_delay_minutes     # total minutes late across days beyond tolerance this month
late_days_count        # count of days beyond tolerance this month
late_deduction_total   # total lateness deduction this month
net_salary              # gross_salary - advances_total - late_deduction_total
```

`late_delay_minutes`, `late_days_count`, and `late_deduction_total` are `0`/`0.00` when the
lateness configuration is disabled or has never been created; `net_salary` is then
numerically identical to `gross_salary - advances_total`.

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

Self-service equivalent of `GET /employees/salary-summary/{employee_id}`, scoped to the
caller. Same response shape as that endpoint (see "Salary Summary" above), including the
lateness delay/deduction breakdown — an employee can see why their own pay was reduced.
`month`/`year` are optional and default to the current month, same as the HR-facing
endpoint.

### GET /employees/me/salary-advances

Self-service equivalent of `GET /employees/salary-advances?employee_id=...`, scoped to the
caller. Same response item shape as that endpoint (see "Salary Advance" above). `month`/`year`
are optional filters; omitting both returns all of the caller's own advances.