# Contract: Employee Self-Service Salary Access (User Story 2)

Status: **PROPOSED — not yet implemented by the backend.** This is a requirement this plan
hands to the backend team, not a description of live behavior. Do not copy this into
`specs/api/employees.md` until the backend team confirms it's actually built that way —
that file documents verified, live behavior only.

## Why this is needed

`specs/api/employees.md` states: *"Requires: HUMAN_RESOURCES on every endpoint in this
file."* That includes `GET /employees/salary-summary/{employee_id}` and
`GET /employees/salary-advances`. The new section in `EmployeeJourney.tsx` (User Story 2) is
shown to a plain `EMPLOYEE`-role user viewing their own check-in screen — they hold no
`HUMAN_RESOURCES` role, so today's contract would reject their own lookup with a permission
error. There is also no documented endpoint that resolves the current authenticated user to
their own `employee_id` (`GET /users/me` returns only user fields, no employee linkage).

## Proposed additions

### Option preferred by this plan: self-scoped variants of the existing endpoints

```text
GET /employees/me                              — no HUMAN_RESOURCES required; returns the
                                                   Employee record linked to the caller's
                                                   own user_id (404 or empty if unlinked)

GET /employees/me/salary-summary?month=&year=  — no HUMAN_RESOURCES required; same response
                                                   shape as GET /employees/salary-summary/{id}
                                                   scoped to the caller's own employee record

GET /employees/me/salary-advances?month=&year= — no HUMAN_RESOURCES required; same response
                                                   shape as GET /employees/salary-advances
                                                   scoped to the caller's own employee_id
```

**Response shapes**: identical to the existing `SalarySummary` / `SalaryAdvance` list shapes
already documented in `specs/api/employees.md` — no new fields, just a permission/scoping
change plus one new self-lookup endpoint.

**Auth**: any authenticated user; the backend derives `employee_id` from the caller's own
`user_id` server-side. A user with no linked employee record gets an empty/404 response, not
another employee's data.

### Rejected alternative

Keeping the existing `{employee_id}`-scoped endpoints but relaxing the role check to
"`HUMAN_RESOURCES` OR (`EMPLOYEE` AND `employee_id` belongs to caller)" — functionally
equivalent, but pushes the ownership check to every call site instead of a self-explanatory
`/me` path. Either is acceptable to the frontend; `/me` is preferred for clarity but the
frontend's `services/employeeService.ts` self-service methods can be pointed at whichever the
backend team ships.

## Frontend consumption (built against this proposed contract)

- `services/employeeService.ts` gains `getMySalarySummary(params?: {month, year})` and
  `getMySalaryAdvances(params?: {month, year})`, calling the `/me` paths above.
- `hooks/useEmployeeSalarySummary.ts` calls both on mount (defaulting to current month/year)
  and re-fetches when the month/year filter changes (FR-008).
- If either call 403s (dependency not yet shipped) or 404s (no linked employee record), the
  hook surfaces an error string; `EmployeeSalarySummary.tsx` renders an inline
  "informação indisponível no momento" message rather than breaking the check-in screen
  (see `research.md` §6).

## Follow-up

Once the backend implements this, update `specs/api/employees.md` by hand to document the
real, verified shape (per this repo's convention that only hand-verified live behavior
belongs there), and remove the "PROPOSED" status from this file or delete it.
