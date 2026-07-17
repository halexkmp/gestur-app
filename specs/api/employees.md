# Employees API

Requires: HUMAN_RESOURCES on every endpoint in this file.

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
```

Create request: `name, pix_key?, salary (>=0), active (default true), start_date`.
Update request (PUT, partial): all fields optional.

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

## Salary Summary

GET /employees/salary-summary/{employee_id} response:

```text
employee_id
month
year
gross_salary
advances_total
net_salary
```