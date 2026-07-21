# Feature Specification: HR Work Schedule Tab (Escala de Trabalho)

**Feature Branch**: `005-hr-schedule-tab`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "add and improvement on hr component, adding a new tab called schedule employee (Escala de Trabalho), this component shows an interactive calendar with each employee that is workinng in thos day, whihc one is abence and which one should work but none journey register was found. Also, update the employee crud that will enable create the schedule work for the employee."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define an employee's weekly work schedule (Priority: P1)

An HR user, while creating or editing an employee record, sets which days of the week
(Monday through Sunday) that employee is expected to work.

**Why this priority**: Every other part of this feature — the calendar, attendance status,
justified absences — depends on a recorded weekly schedule existing first. Without it there
is nothing for the calendar to display.

**Independent Test**: Can be fully tested by editing an employee, selecting a set of
weekdays, saving, and reopening the employee form to confirm the same days are shown as
selected — delivers value on its own even before the calendar tab is built.

**Acceptance Scenarios**:

1. **Given** an employee with no work schedule saved yet, **When** HR opens the employee
   form and selects Monday through Friday as work days, then saves, **Then** the employee's
   weekly schedule is stored and shown as Monday–Friday the next time the form is opened.
2. **Given** an employee already has a Monday–Friday schedule, **When** HR changes the
   selection to include Saturday and saves, **Then** the previous selection is fully replaced
   by the new one (Monday–Saturday).
3. **Given** HR is creating a brand-new employee, **When** HR leaves every weekday
   unselected and saves the employee, **Then** no weekly schedule is recorded for that
   employee (distinct from a schedule where every day is explicitly marked as a day off).

---

### User Story 2 - View the team's work schedule calendar (Priority: P2)

An HR user opens the new "Escala de Trabalho" tab, picks a month, and sees — for every
active employee and every day in that month — whether the employee worked, had a justified
absence, or was expected to work but has no journey register and no justification on file.

**Why this priority**: This is the main deliverable requested: a single view that replaces
manually cross-checking schedules, journeys, and absences for each employee.

**Independent Test**: Can be fully tested by opening the tab for a month where at least one
employee has a configured schedule, and confirming each day cell reflects the correct status,
without needing the ability to act on any cell yet.

**Acceptance Scenarios**:

1. **Given** an employee has a Monday–Friday schedule and checked in (has a journey register)
   every weekday in the displayed month, **When** HR views the calendar for that month,
   **Then** every weekday cell for that employee shows "worked" and every weekend cell shows
   "not scheduled."
2. **Given** an employee was scheduled to work on a specific day but has no journey register
   and no justified absence for that day, **When** HR views the calendar, **Then** that day's
   cell is flagged as an unjustified absence.
3. **Given** an employee has a justified absence recorded for a scheduled work day, **When**
   HR views the calendar, **Then** that day's cell shows "justified absence," not "worked" or
   "unjustified absence," even if a journey register also exists for that day.
4. **Given** an employee has no weekly schedule defined at all, **When** HR views the
   calendar for any month, **Then** that employee's days show as "no schedule defined" rather
   than as absences.
5. **Given** an employee is currently inactive, **When** HR views the calendar for a month
   that includes days before the employee became inactive, **Then** the entire month shows
   as "no data" for that employee, consistent with how attendance data is unavailable for
   inactive employees.
6. **Given** HR is viewing the calendar, **When** HR switches to the previous or next month,
   **Then** the calendar reloads and shows the correct statuses for the newly selected month.

---

### User Story 3 - Justify an absence directly from the calendar (Priority: P3)

An HR user, seeing a day flagged as an unjustified absence on the calendar, records a
justification (with an optional reason) for that employee and day directly from the
calendar view.

**Why this priority**: Turns the calendar from a read-only report into an actionable tool,
closing the loop on the "which one is absent" part of the request — but the calendar
delivers value on its own even without this action, so it is lower priority than Stories 1–2.

**Independent Test**: Can be fully tested by clicking an unjustified-absence cell, entering a
reason, confirming, and observing that the same cell now shows "justified absence."

**Acceptance Scenarios**:

1. **Given** a day cell flagged as an unjustified absence, **When** HR clicks it and confirms
   a justification (with or without a reason), **Then** the absence is recorded and the cell
   updates to show "justified absence."
2. **Given** HR attempts to justify a day that is not one of the employee's scheduled work
   days, **Then** the calendar does not offer this action for that cell.
3. **Given** a justified absence already exists for an employee and day, **When** HR attempts
   to justify that same day again, **Then** the system shows a clear error and does not create
   a duplicate record.
4. **Given** a justified absence was recorded in error, **When** HR removes it from the
   calendar, **Then** the day's cell reverts to reflecting the employee's actual attendance
   status (worked or unjustified absence).

---

### Edge Cases

- What happens when an employee is hired partway through the displayed month? Their schedule
  and attendance status should only be evaluated for days within their active employment
  period; days before their start date should not be shown as absences.
- What happens when an employee has a linked account removed or was never linked to a user
  account? Presence cannot be determined, so their days should show as "no data," not as
  unjustified absences.
- How does the calendar behave for a month with a very large number of active employees?
  The view must remain usable (e.g., scrollable, filterable by employee) rather than
  degrading or failing to render.
- What happens if HR tries to set a weekly schedule where every day is unmarked to
  explicitly represent "employee has no fixed schedule right now"? This is a valid,
  intentional state distinct from never having configured a schedule at all, and must be
  preserved as such.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow HR/Admin users to define, for each employee, which days of
  the week (Monday–Sunday) that employee is expected to work, as part of the existing
  employee create/edit flow.
- **FR-002**: System MUST allow HR/Admin users to change an employee's weekly work schedule
  at any time, with the new selection fully replacing the previous one.
- **FR-003**: System MUST provide a new "Escala de Trabalho" (Work Schedule) tab in the HR
  area, alongside the existing Funcionários, Salário, Jornadas, and Configuração de Atrasos
  tabs.
- **FR-004**: The Work Schedule tab MUST display an interactive calendar for a selected
  month, broken down per employee.
- **FR-005**: For each employee and each day shown, the calendar MUST indicate one of:
  scheduled and worked, scheduled with a justified absence, scheduled with no journey
  register and no justification (unjustified absence), or not a scheduled work day.
- **FR-006**: The calendar MUST let HR/Admin navigate between months.
- **FR-007**: The calendar MUST let HR/Admin narrow the view to a specific employee as well
  as see all employees at once.
- **FR-008**: System MUST allow HR/Admin to register a justified absence, with an optional
  reason, directly from an unjustified-absence day in the calendar.
- **FR-009**: System MUST prevent a justified absence from being recorded on a day that is
  not one of the employee's scheduled work days, or that already has a justified absence,
  and MUST surface a clear message when this is attempted.
- **FR-010**: System MUST allow HR/Admin to remove a previously registered justified absence
  from the calendar.
- **FR-011**: The calendar MUST distinguish "no schedule defined," "no linked account," and
  "inactive employee" from an unjustified absence, rather than flagging any of them as a
  missed work day.
- **FR-012**: Access to the Work Schedule tab and to the schedule-editing fields in the
  employee CRUD MUST be restricted to Human Resources and Admin users, matching the access
  rules already applied to the rest of the HR module.

### Key Entities

- **Employee Weekly Schedule**: A recurring, per-employee flag for each day of the week
  (Monday–Sunday) indicating whether that employee is normally expected to work that day.
  One schedule per employee; absence of a schedule is itself a meaningful, distinct state.
- **Justified Absence**: A record of an employee's excused absence on one specific scheduled
  work day, with an optional reason and a creation timestamp.
- **Attendance Day Status**: A computed, read-only classification of a given calendar day for
  a given employee — worked, justified absence, or unjustified absence — derived from the
  employee's weekly schedule, their journey registers, and any justified absences on file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: HR can determine, for any active employee and any day in a selected month,
  whether that employee was expected to work and what their attendance status was, from a
  single screen, without cross-referencing separate reports.
- **SC-002**: HR can configure a new employee's work schedule as part of the same flow used
  to create the employee, with no separate follow-up step required.
- **SC-003**: HR can identify every employee with an unresolved (unjustified) absence in a
  given month within 30 seconds of opening the calendar.
- **SC-004**: Justifying a flagged absence takes no more than two actions (e.g., select the
  cell, confirm) from the calendar view.
- **SC-005**: Every day the calendar marks as an unjustified absence corresponds to a
  scheduled work day with no matching journey register and no justified absence on file —
  zero false positives against the underlying attendance data.

## Assumptions

- The weekly schedule is recurring (the same days apply every week); one-off exceptions to
  that recurring pattern are handled through justified absences, not through a different
  schedule per week.
- The calendar covers all employees (active and inactive), showing inactive employees with
  a "no data" status rather than hiding them, so HR can still see who is inactive.
- The calendar reuses the existing attendance classification already computed by the backend
  (worked / justified absence / unjustified absence) rather than introducing new statuses of
  its own.
- Only Human Resources and Admin users interact with this tab and the schedule-editing
  fields; regular employees continue to see only their own schedule through the existing
  self-service view, which this feature does not change.
- Building the "all employees at once" calendar view means combining each employee's
  individual schedule and attendance data rather than relying on a single bulk endpoint,
  since no such bulk lookup exists today; if this proves too slow for large teams, that is a
  follow-up backend concern rather than something this spec resolves.
