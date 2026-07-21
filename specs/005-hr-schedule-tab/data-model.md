# Phase 1 Data Model: HR Work Schedule Tab (Escala de Trabalho)

This feature adds no new backend entities (the backend already models all of this per
`specs/api/employees.md`) but does add new frontend types: backend-shape types the API hasn't
had a frontend representation for yet, and purely client-side view-model types the calendar
renders from. All of the below are added to `src/types/employee.ts` and re-exported through
`src/types/index.ts`'s existing `export * from './employee'`.

## Backend-shape types (new)

### `EmployeeWeeklySchedule`

Mirrors `GET`/`PUT /employees/schedule/{employee_id}` (see `specs/api/employees.md`,
"Employee Weekly Schedule").

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

- No schedule ever set for an employee → the `GET` call resolves to `null` at the service
  layer (see `contracts/employee-schedule-hook.md`), not this shape — components must treat
  `null` as "not configured," not as "all days false."

### `UpdateEmployeeWeeklyScheduleRequest`

Request body for `PUT /employees/schedule/{employee_id}` — same seven boolean fields as above,
all required (full replace, no partial patch, per contract).

### `JustifiedAbsence`

Mirrors the list-item shape from `GET /employees/justified-absences` (see "Justified Absence").

```text
id
employee_id
absence_date   # ISO date
reason         # nullable
created_at
```

### `CreateJustifiedAbsenceRequest`

Request body for `POST /employees/justified-absences`.

```text
employee_id
absence_date   # ISO date
reason         # nullable
```

### `AttendanceDayStatus` (union type)

```text
'PRESENT' | 'JUSTIFIED_ABSENCE' | 'UNJUSTIFIED_ABSENCE'
```

### `AttendanceDay`

```text
date      # ISO date
status    # AttendanceDayStatus
```

### `AttendanceVerificationResponse`

Mirrors `GET /employees/attendance-verification/{employee_id}` (see "Attendance Verification").

```text
employee_id
month
year
days                          # AttendanceDay[] — only the employee's scheduled work days,
                               # within the requested month/year and within their active
                               # employment period (per contract)
unjustified_absence_count
```

## Client-side view-model types (new — never sent to or received from the backend)

### `CalendarCellState` (union type)

The single rendering state each day cell resolves to, computed by `useWorkSchedule` (see
`contracts/use-work-schedule-hook.md`) from the composition of `EmployeeWeeklySchedule | null`,
`AttendanceVerificationResponse`, and the employee's own `active`/`user_id`/`start_date` fields.

```text
'WORKED' | 'JUSTIFIED_ABSENCE' | 'UNJUSTIFIED_ABSENCE' | 'NOT_SCHEDULED' | 'NO_DATA'
```

### `CalendarDayCell`

```text
date      # ISO date (yyyy-MM-dd)
state     # CalendarCellState
detail?   # human-readable reason shown in a tooltip, e.g. "Antes da contratação",
          # "Sem escala definida", "Funcionário inativo", "Sem conta vinculada", "Folga"
```

No `justifiedAbsenceId` field: the id needed to remove a justification is resolved lazily, on
demand, only when HR opens the remove action for a `JUSTIFIED_ABSENCE` cell — see
`removeJustification` in `contracts/use-work-schedule-hook.md`. Attaching it to every cell
eagerly would require fetching `GET /employees/justified-absences` for every employee on every
load, for a lookup most page views never use (see `research.md`'s lazy-resolution decision).

### `EmployeeScheduleRow`

One row of the roster grid (`ScheduleGrid`), or the source for one `ScheduleMonthCalendar`.

```text
employee                    # Employee (existing type, unchanged)
hasSchedule                 # bool — false ⇒ every cell in `days` is NO_DATA regardless of
                             #   any attendance-verification data (no schedule ⇒ nothing to
                             #   compute against)
days                         # CalendarDayCell[] — one entry per day of the displayed month
unjustifiedAbsenceCount      # echoed from AttendanceVerificationResponse (0 if hasSchedule is false)
```

## Derivation rules (state machine for `CalendarCellState`)

Resolved in two passes: an employee-level pass (decides whether any network call beyond
attendance-verification is needed, and whether the whole month short-circuits), then a
per-day pass. Steps 1-2 use only fields already present on the `Employee` fetched from
`GET /employees/?active=true` — **no additional network call** is needed for them (see
`research.md`'s fetch-scoping decision).

**Employee-level pass**:

1. Employee is inactive (`Employee.active === false`) → every day this month is `NO_DATA`,
   detail "Funcionário inativo" — per the Attendance Verification contract note that inactive
   employees report empty data for the *entire* requested period, not just days after
   deactivation. No further checks needed.
2. Employee has no linked user account (`Employee.user_id` is null/absent) → every day this
   month is `NO_DATA`, detail "Sem conta vinculada". No further checks needed.
3. `Employee.start_date` falls after the last day of the requested month (not yet hired at all
   this month) → every day this month is `NOT_SCHEDULED`, detail "Antes da contratação". No
   schedule fetch is attempted — an empty `days[]` here means "not hired yet," not an
   ambiguous schedule state, so it must be ruled out *before* the next step.
4. Otherwise, the employee is active, linked, and at least partially employed during the
   requested month: if `AttendanceVerificationResponse.days` is empty, this is the one
   genuinely ambiguous case (could mean "no weekly schedule at all," or "a schedule exists but
   is explicitly set to zero work days," per spec's final Edge Case) — only here does the hook
   make the conditional `GET /employees/schedule/{id}` call to disambiguate: `null` (404) →
   every day this month is `NO_DATA`, detail "Sem escala definida"; a loaded
   `EmployeeWeeklySchedule` (necessarily all seven flags false, or `days[]` would not be empty)
   → every day this month is `NOT_SCHEDULED`, detail "Folga" (a real, deliberate zero-work-days
   schedule, not missing data). If `days[]` is non-empty, no schedule fetch happens at all.

**Per-day pass** (only reached for an employee that didn't short-circuit above):

5. Day is before `Employee.start_date` → `NOT_SCHEDULED`, detail "Antes da contratação"
   (mid-month hires: the attendance-verification endpoint never reports pre-employment days,
   so this is inferred client-side from `start_date`, not from the API response).
6. Date not found in `AttendanceVerificationResponse.days` (and not caught by step 5) →
   `NOT_SCHEDULED`, detail "Folga" — inferred directly from the date's absence from `days`; no
   schedule fetch is needed to know an ordinary day off is a day off, since the contract
   guarantees every scheduled work day within active employment appears in `days`.
7. Date found in `days` → `PRESENT` → `WORKED`; `JUSTIFIED_ABSENCE` → `JUSTIFIED_ABSENCE`;
   `UNJUSTIFIED_ABSENCE` → `UNJUSTIFIED_ABSENCE`. No id is attached to a `JUSTIFIED_ABSENCE`
   cell at this point — see `CalendarDayCell` above and `removeJustification` in
   `contracts/use-work-schedule-hook.md` for the lazy id lookup used only when HR acts on the
   cell.

## State ownership

| State | Owner | Notes |
|---|---|---|
| `EmployeeWeeklySchedule \| null` for the employee being edited | `useEmployeeSchedule` hook | `null` = "not configured" (404), distinct from a loaded all-false schedule |
| Seven day-checkbox values + the configure-schedule toggle | `EmployeeFormModal` (local UI state) | Purely presentational; submits via `useEmployeeSchedule`'s `save` on form submit |
| `EmployeeScheduleRow[]` for the selected month/year | `useWorkSchedule` hook | Replaces nothing existing — this is new state; recomputed on month/year change |
| Selected month/year | `useWorkSchedule` hook | Defaults to current month/year, consistent with `useEmployeePaychecks`/`useEmployeeSalarySummary` |
| Selected employee filter (all vs. one) | `ScheduleTab` (local UI state) | Purely a rendering choice over already-fetched `EmployeeScheduleRow[]` — does not trigger a new fetch |
| Justify/remove-absence modal open state + form fields | `JustifyAbsenceModal` (local UI state) | Submits via `useWorkSchedule`'s `justifyAbsence` / `removeJustification`, which refresh only the affected employee's row |
| Resolved `JustifiedAbsence.id` for a remove action | `useWorkSchedule`'s `removeJustification` (transient, not cached) | Looked up fresh via `employeeService.listJustifiedAbsences` at the moment removal is requested — never stored on `CalendarDayCell` or in any longer-lived state |
