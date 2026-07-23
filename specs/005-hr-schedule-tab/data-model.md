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

Mirrors `GET /employees/attendance-verification/{employee_id}`. Used only for the
single-employee, single-row refresh after a justify/remove action (see
`contracts/use-work-schedule-hook.md`) — the bulk roster load below uses `ScheduleOverviewItem`
instead.

```text
employee_id
month
year
days                          # AttendanceDay[] — only the employee's scheduled work days,
                               # within the requested month/year and within their active
                               # employment period (per contract)
unjustified_absence_count
```

### `ScheduleOverviewItem` / `ScheduleOverviewResponse`

Mirrors `GET /employees/schedule-overview` (see "Employee Schedule Overview (Bulk)"). Powers
the roster's bulk load — one call returns every employee's schedule + attendance for a month
instead of up to two per-employee calls each.

```text
ScheduleOverviewResponse:
  items: ScheduleOverviewItem[]

ScheduleOverviewItem:
  employee_id
  monday      # bool
  tuesday     # bool
  wednesday   # bool
  thursday    # bool
  friday      # bool
  saturday    # bool
  sunday      # bool
  month
  year
  days                          # AttendanceDay[] — same semantics as AttendanceVerificationResponse.days
  unjustified_absence_count
```

- An employee **absent** from `items` has no Employee Weekly Schedule at all — per the
  contract, "Employees with no schedule are omitted entirely from `items`." This is the
  authoritative "has a schedule" signal; no separate lookup is needed to disambiguate it from
  an all-days-off schedule (which *does* appear in `items`, just with `days: []`).
- The `monday`..`sunday` flags are read by `useWorkSchedule`'s derivation logic to disambiguate
  a date missing from `days`: it's a real day off (`NOT_SCHEDULED`/Folga) only if the flag for
  that weekday is `false`; if the flag is `true`, the date is a work day that simply hasn't
  happened yet (`NO_DATA`/"Ainda não ocorreu") — see step 6 under Derivation rules below. An
  earlier version of this logic treated any date missing from `days` as Folga, which
  misclassified future work days (always absent from `days` since they haven't occurred yet) as
  days off.

## Client-side view-model types (new — never sent to or received from the backend)

### `CalendarCellState` (union type)

The single rendering state each day cell resolves to, computed by `useWorkSchedule` (see
`contracts/use-work-schedule-hook.md`) from the composition of the matching
`ScheduleOverviewItem` (or its absence), and the employee's own `active`/`user_id`/`start_date`
fields.

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
weeklyPattern                # WeeklySchedulePattern | null — the matching item's monday..sunday
                             #   flags (null when hasSchedule is false); carried on the row so a
                             #   single-employee refresh (justify/remove) can redo the per-day
                             #   pass without needing the flags from AttendanceVerificationResponse,
                             #   which doesn't include them
days                         # CalendarDayCell[] — one entry per day of the displayed month
unjustifiedAbsenceCount      # echoed from AttendanceVerificationResponse (0 if hasSchedule is false)
```

## Derivation rules (state machine for `CalendarCellState`)

Resolved in two passes: an employee-level pass (decides whether the whole month
short-circuits), then a per-day pass. Steps 1-2 use only fields already present on the
`Employee` fetched from `GET /employees/` — **no additional network call** is needed for them.

**Employee-level pass**:

1. Employee is inactive (`Employee.active === false`) → every day this month is `NO_DATA`,
   detail "Funcionário inativo" — per the Attendance Verification contract note that inactive
   employees report empty data for the *entire* requested period, not just days after
   deactivation. No further checks needed.
2. Employee has no linked user account (`Employee.user_id` is null/absent) → every day this
   month is `NO_DATA`, detail "Sem conta vinculada". No further checks needed.
3. `Employee.start_date` falls after the last day of the requested month (not yet hired at all
   this month) → every day this month is `NOT_SCHEDULED`, detail "Antes da contratação".
4. Otherwise, look up the employee's id in the bulk `ScheduleOverviewResponse.items` (already
   fetched alongside the employee list — see `contracts/use-work-schedule-hook.md`): absent →
   every day this month is `NO_DATA`, detail "Sem escala definida" (no schedule at all — this
   is now a direct lookup, not something inferred from an empty `days[]`, since the bulk
   endpoint's own contract makes item-presence the "has a schedule" signal). Present → proceed
   to the per-day pass with the item's `monday`..`sunday` flags and `days[]` (an item with every
   flag `false` is a real, deliberate zero-work-days schedule, and every day resolves to
   `NOT_SCHEDULED`/Folga via step 6 below without needing special-casing).

**Per-day pass** (reached for any employee with a matching `ScheduleOverviewItem`):

5. Day is before `Employee.start_date` → `NOT_SCHEDULED`, detail "Antes da contratação"
   (mid-month hires: the attendance data never reports pre-employment days, so this is
   inferred client-side from `start_date`, not from the API response).
6. Date found in `days`, status `PRESENT` → `WORKED`; `JUSTIFIED_ABSENCE` → `JUSTIFIED_ABSENCE`.
   An explicit status always wins over the weekly-pattern check below, since the contract
   guarantees a date only appears in `days` when it's a real scheduled work day.
7. Date found in `days`, status `UNJUSTIFIED_ABSENCE`, but the date is today or later → `NO_DATA`,
   detail "Ainda não ocorreu" — a day that hasn't happened yet can't be a confirmed absence, it
   simply has no data yet (see `research.md`'s "day hasn't occurred" fix).
8. Date found in `days`, status `UNJUSTIFIED_ABSENCE`, and the date is strictly before today →
   `UNJUSTIFIED_ABSENCE`. No id is attached to this cell — see `CalendarDayCell` above and
   `removeJustification` in `contracts/use-work-schedule-hook.md` for the lazy id lookup used
   only when HR acts on a `JUSTIFIED_ABSENCE` cell (step 6).
9. Date not found in `days` (and not caught by step 5): the weekly pattern decides which of the
   two remaining states applies. The weekday's flag is `false` → `NOT_SCHEDULED`, detail "Folga"
   (a real day off). The weekday's flag is `true` → `NO_DATA`, detail "Ainda não ocorreu" (a
   scheduled work day that hasn't happened yet, so the backend hasn't reported a status for it —
   this is the common case for every future work day in the month, not just today's).

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
