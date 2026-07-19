# Feature Specification: Lateness Configuration & Employee Salary Visibility

**Feature Branch**: `002-lateness-salary-visibility`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Create a new screen about journey configurations with tolerance, expectated entrace time, discounts based on delays and delay time (check the employee api contract for more). Also add on the initial sceeen for employments(register journey) the visibility about their salary, advanced salaries, delays and discount on salary about delays. This second sceen should be responsive for mobiles."

## Clarifications

### Session 2026-07-19

- Q: Which screen should host the new salary/advances/lateness visibility for employees? → A: The employee's own self-service journey/check-in screen (where they register their daily journey), directly below the "register journey" button — not the HR employee create/edit form. It must include a month/year filter, and its data shape follows `GET /employees/salary-summary/{employee_id}` from the API contract.
- Q: The API contract marks every `/employees/*` endpoint (including salary-summary, salary-advances, and lateness-config) as requiring the `HUMAN_RESOURCES` role, but this section is shown to a plain `EMPLOYEE` viewing their own check-in screen — how should the spec treat that access gap? → A: Treat self-scoped access as a required backend dependency of this feature. The backend must be extended so an authenticated employee can retrieve their own salary-summary/advances data; this is a prerequisite for User Story 2, called out explicitly rather than silently worked around in the frontend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure lateness rules (Priority: P1)

An HR administrator needs one shared place to define how employee lateness is judged and
penalized: what time employees are expected to check in, how much grace period they get
before being considered late, and how pay is reduced for each block of lateness beyond that
grace period. Today this configuration either doesn't exist in the UI or is buried, so HR
cannot adjust it without going around the system.

**Why this priority**: Without this configuration screen, the lateness/deduction rules
that the rest of the feature depends on cannot be set or changed at all — this is the
foundation the salary visibility in User Story 2 reads from.

**Independent Test**: Can be fully tested by opening the new configuration screen, entering
an expected entrance time, tolerance, deduction interval, and deduction amount, saving, and
confirming the saved values are shown correctly the next time the screen is opened.

**Acceptance Scenarios**:

1. **Given** no lateness configuration has been set yet, **When** an HR administrator opens
   the configuration screen, **Then** the screen shows the rule disabled with empty/zeroed
   fields rather than an error.
2. **Given** the configuration screen is open, **When** the HR administrator sets an
   expected entrance time, a tolerance (in minutes), a deduction interval (in minutes), and
   a deduction amount, and saves, **Then** the values persist and are shown pre-filled the
   next time the screen is opened.
3. **Given** an existing configuration, **When** the HR administrator toggles the rule off
   and saves, **Then** the system stops applying lateness deductions going forward while
   keeping the previously entered numeric values visible for quick re-enabling.
4. **Given** the HR administrator enters a negative tolerance, a zero or negative deduction
   interval, or a negative deduction amount, **When** they attempt to save, **Then** the
   screen rejects the save and explains which value is invalid.
5. **Given** the current user does not have HR permissions, **When** they attempt to reach
   this screen, **Then** access is denied.

---

### User Story 2 - Employee sees their own salary impact on the check-in screen (Priority: P2)

An employee, when opening the screen they use every day to register their journey
(check-in), needs to see — directly below the "register journey" button, without going
anywhere else — their own salary, any salary advances already taken, how many days/minutes
they've been late, and how much has been deducted from their pay as a result, filterable by
month.

**Why this priority**: This is the payoff of User Story 1 — it turns the configured rule
into something an employee can see for themselves on the screen they already visit daily.
It depends on lateness configuration existing (P1), and on a backend dependency (see
Assumptions) that lets an employee fetch their own salary/advance data.

**Independent Test**: Can be fully tested by logging in as an employee, opening the journey
check-in screen, and confirming the section below the register button shows gross salary,
advances, lateness totals, deduction, and net salary for the current month by default, and
updates correctly when a different month is chosen — on both desktop and mobile-sized
screens.

**Acceptance Scenarios**:

1. **Given** an employee opens their journey check-in screen, **When** the screen loads,
   **Then** a section directly below the "register journey" button shows their gross
   salary, total salary advances, total minutes late, number of late days, total lateness
   deduction, and net pay for the current month.
2. **Given** the section is showing the current month's figures, **When** the employee
   selects a different month (and year), **Then** the figures update to reflect the newly
   selected period.
3. **Given** the lateness configuration is disabled or has never been set, **When** the
   employee views the section, **Then** lateness and deduction figures show as zero and net
   pay equals gross salary minus advances only.
4. **Given** the employee has no salary advances for the selected period, **When** they view
   the section, **Then** the advances figure shows as zero/none rather than an error or
   blank state.
5. **Given** the check-in screen is viewed on a mobile-sized screen, **When** the employee
   scrolls through the salary/advances/lateness information, **Then** all figures remain
   fully readable and usable in a single column, without horizontal scrolling or overlapping
   content.
6. **Given** the employee is viewing this section, **When** the figures load, **Then** only
   that employee's own data is ever shown — never another employee's.

---

### Edge Cases

- What happens when HR opens the lateness configuration screen for the very first time and
  no rule has ever been saved? (Must show a disabled, zeroed-out state, not an error.)
- What happens when the expected entrance time, tolerance, or deduction fields are left
  blank on save? (Save must be blocked with a clear message — all fields are required.)
- What happens when an employee has late days but the configuration is later disabled
  retroactively? (Historical deduction figures already reported are not recalculated by this
  feature; only current-period figures reflect current configuration.)
- What happens when an employee has zero salary advances or zero lateness for the month
  being viewed? (Each figure independently displays zero rather than hiding the section.)
- What happens when an employee selects a month with no journey/check-in activity at all?
  (Salary and advances still show correctly; lateness figures show zero.)
- What happens when the required backend self-scoped access dependency (see Clarifications)
  is not yet available? (This blocks User Story 2 from functioning end-to-end; it must be
  tracked as a dependency, not worked around by widening frontend role checks.)
- What happens when the employee salary section is viewed on a very narrow mobile screen?
  (Content reflows into a single readable column instead of being clipped or requiring
  horizontal scroll.)
- What happens when a non-HR user tries to reach the lateness configuration screen? (Access
  is denied.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated screen, accessible only to HR administrators,
  for viewing and editing the lateness configuration rule.
- **FR-002**: The lateness configuration screen MUST allow setting: whether the rule is
  enabled, the expected entrance time, the tolerance grace period (in minutes), the
  deduction interval (in minutes of delay per deducted block), and the deduction amount per
  block.
- **FR-003**: System MUST load and pre-fill the current lateness configuration when the
  screen opens, showing a disabled/zeroed state when no configuration has ever been saved.
- **FR-004**: System MUST validate that tolerance is zero or greater, the deduction interval
  is greater than zero, and the deduction amount is zero or greater, blocking save and
  showing a clear message when any of these are violated.
- **FR-005**: System MUST require all configuration fields to be present on save (the
  configuration is fully replaced each time it is saved, not partially updated).
- **FR-006**: System MUST deny access to the lateness configuration screen for users
  without HR permissions.
- **FR-007**: System MUST display, directly below the journey-registration control on the
  employee's own journey check-in screen, that employee's gross salary, total salary
  advances for the selected period, total minutes late, count of late days, total lateness
  deduction, and resulting net salary.
- **FR-008**: System MUST allow the employee to filter this salary/advances/lateness view
  by month and year, defaulting to the current month and year when the screen first loads.
- **FR-009**: System MUST show zero values (not errors or blank sections) for
  advances/lateness/deduction figures when the employee has no advances, has no late days
  for the selected period, or when the lateness configuration is disabled/unset.
- **FR-010**: System MUST ensure the journey check-in screen only ever shows the currently
  authenticated employee's own salary/advances/lateness figures, never another employee's.
- **FR-011**: The employee salary/advances/lateness view MUST be fully usable on
  mobile-sized screens (no horizontal scrolling, no overlapping or clipped content), in
  addition to desktop, consistent with the check-in screen it lives on.
- **FR-012**: The lateness configuration screen's layout is desktop-first; mobile
  responsiveness is only required for the employee salary visibility view (User Story 2),
  per the feature description.

### Key Entities

- **Lateness Configuration**: A single, system-wide rule describing whether lateness
  deductions are active, the time employees are expected to check in by, how many minutes
  of grace period are allowed before a check-in counts as late, how many minutes of delay
  make up one deducted "block," and how much pay is deducted per block.
- **Employee Salary Summary**: A per-employee, per-selected-month view combining the
  employee's base (gross) salary, total salary advances taken, total minutes and days late,
  total amount deducted for lateness, and the resulting net salary.
- **Salary Advance**: A record of an amount advanced to an employee ahead of their regular
  pay, associated with a specific employee and date, contributing to the total advances
  figure shown on the employee's check-in screen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: HR administrators can view or update the lateness configuration rule in under
  1 minute without needing help or documentation.
- **SC-002**: 100% of employees viewing their own check-in screen see correct gross salary,
  advances, lateness, deduction, and net salary figures for the selected month, including
  zero-value cases.
- **SC-003**: The employee salary visibility section is fully readable and usable (no
  clipped or overlapping content, no horizontal scroll) on mobile screen widths as small as
  360px.
- **SC-004**: Employees can view only their own salary/advance/lateness figures — never
  another employee's — in 100% of access attempts, and non-HR users cannot reach the
  lateness configuration screen in 100% of access attempts.

## Assumptions

- "Journey configuration" in the request refers to the system-wide lateness/late-arrival
  deduction rule that governs how check-in delays affect pay (the only configuration of
  this kind exposed by the backend), not a per-employee or per-journey-entry setting.
- "The initial screen for employments (register journey)" refers to the employee's own
  self-service journey check-in screen — the screen an employee uses to register their
  daily journey — with the new salary/advances/lateness section placed directly below the
  existing "register journey" button. It is not the HR-facing employee create/edit form.
- This feature depends on the backend being extended so an authenticated employee (holding
  only the `EMPLOYEE` role) can retrieve their own salary-summary and salary-advances data,
  and can be resolved to their own employee record, without needing the `HUMAN_RESOURCES`
  role. Today's documented contract requires `HUMAN_RESOURCES` on every `/employees/*`
  endpoint and has no self-service "my employee record" lookup; closing this gap is a
  prerequisite for User Story 2 and is out of scope for the frontend work alone.
- Salary, advances, lateness, and deduction figures default to the current month/year when
  the check-in screen loads, with the employee able to change the selected month/year via
  the required filter (FR-008).
- Only HR administrators can view or edit the lateness configuration; employees can only
  ever see their own salary/advance/lateness figures, never another employee's.
- Editing salary advances (creating/removing individual advance entries) is out of scope
  for this feature — it only covers *visibility* of the totals on the employee's check-in
  screen; advance management continues to live wherever HR manages it today.
- Mobile responsiveness is explicitly required for the employee salary visibility section
  on the check-in screen; the lateness configuration screen may remain desktop-oriented
  since the request only calls out the "second screen" as needing to be responsive.
