# Feature Specification: Salary Tab Bulk Data Loading

**Feature Branch**: `006-salary-bulk-summary`

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "change the salary tab request on salary summarry enpoint, to send only year or month. This endpoint will not return employee by employee but for all. Also, not send a request to salary-advances, the request salary summary will return this list. THe api contract still not updated, but the body response will be the same as tody."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See every employee's salary summary at once (Priority: P1)

An HR user opens the Salário tab, selects a month and year, and sees the gross salary,
advance deductions, lateness deductions, and net salary for every active employee already
populated in the table — without needing to expand each employee's row one at a time to
trigger their figures to load.

**Why this priority**: This is the core of the requested change: today, the summary figures
for each employee only load when that employee's row is individually expanded, meaning
reviewing the whole team's pay for a period requires expanding every row in turn. Loading
everyone's summary together for the selected period is the primary value of this feature.

**Independent Test**: Can be fully tested by selecting a month/year on the Salário tab and
confirming every active employee's row already shows gross salary, advance deductions,
lateness deductions, and net salary, with no row still showing only the base salary
placeholder.

**Acceptance Scenarios**:

1. **Given** the Salário tab for a month/year with several active employees, **When** HR
   opens or reloads the tab, **Then** every active employee's row shows that period's gross
   salary, advances total, lateness deduction, and net salary without HR needing to expand
   any row first.
2. **Given** the Salário tab has finished loading for the current period, **When** HR expands
   an employee's row, **Then** the detail panel opens immediately with no additional loading
   state, since the figures were already retrieved.
3. **Given** a large number of active employees, **When** HR loads the Salário tab for a
   period, **Then** the page loads all employees' figures together rather than one at a time,
   so the wait does not grow noticeably as headcount grows.

---

### User Story 2 - See an employee's advances without a separate wait (Priority: P2)

An HR user expands an employee's row to review their salary advances for the selected
period and sees the list of advances immediately, without the row showing a separate
"loading advances" state after the summary has already appeared.

**Why this priority**: Today, advances are fetched as a second, separate request only when a
row is expanded. Folding this into the same bulk data as the summary removes a second wait
and a second point of failure per employee, but it's secondary to the headline change in
User Story 1.

**Independent Test**: Can be fully tested by expanding an employee's row and confirming the
advances list (or the "no advances this period" message) appears at the same time as the
summary figures, with no separate spinner for advances.

**Acceptance Scenarios**:

1. **Given** an employee has one or more salary advances in the selected period, **When** HR
   expands that employee's row, **Then** the advances are already shown, with no separate
   loading indicator for the advances list.
2. **Given** an employee has no salary advances in the selected period, **When** HR expands
   that employee's row, **Then** the row shows "no advances this period" immediately, not a
   loading state that resolves into that message.
3. **Given** HR creates or deletes a salary advance for an employee, **When** the action
   completes, **Then** that employee's advances total, net salary, and advances list all
   reflect the change without HR needing to reload the whole tab.

---

### Edge Cases

- What happens when the bulk data fails to load for the selected period? The whole tab shows
  a single error state with a retry action, rather than each row failing independently.
- What happens when HR changes the month or year while a row is expanded? The expanded row's
  figures and advances refresh to match the newly selected period, consistent with existing
  behavior for changing the period.
- What happens when there are no active employees at all? The table shows the existing empty
  state; there is nothing to bulk-load.
- What happens when an employee is added or deactivated between period selections? The next
  load for a period reflects the current active employee list, consistent with today.
- Does narrowing the table with the existing employee filter trigger a new load? No — the
  filter continues to narrow the already-loaded data for the selected period.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve the salary summary (gross salary, advances total, late
  delay minutes, late days count, late deduction total, net salary) for every active employee
  for a selected month/year as a single combined operation, rather than one operation per
  employee.
- **FR-002**: System MUST include each employee's salary advance records for the selected
  period as part of that same combined operation, without a separate operation per employee.
- **FR-003**: System MUST NOT trigger any additional data load when HR expands an individual
  employee's row, since that employee's summary and advances are already available from the
  combined load for the selected period.
- **FR-004**: When HR changes the selected month or year, the system MUST refresh the
  combined salary summary and advances for all employees to match the newly selected period.
- **FR-005**: The system MUST continue to let HR narrow the displayed employees using the
  existing employee filter without triggering any additional data load.
- **FR-006**: If the combined salary data fails to load for a period, the system MUST show a
  single error state, with a retry action, covering all employees, rather than a per-row
  error.
- **FR-007**: Creating or deleting a salary advance for an employee MUST update that
  employee's advances total, net salary, and advances list without requiring HR to reload the
  whole tab.
- **FR-008**: The values and definitions of every figure shown (gross salary, advances total,
  late delay minutes, late days count, late deduction total, net salary, and each advance
  record's fields) MUST remain exactly as they are today — this feature changes how and when
  the data is retrieved, not what the data means or contains.

### Key Entities

- **Employee Salary Period Summary**: The gross salary, total advance deductions, lateness
  deduction breakdown, and net salary for one active employee for one selected month/year,
  now retrieved together with the equivalent summaries for every other active employee in the
  same operation, rather than one at a time.
- **Salary Advance**: An individual advance payment record (amount, date, optional note)
  attributed to one employee, now delivered as part of that employee's Employee Salary Period
  Summary for the relevant period instead of via a separate lookup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: HR can review gross salary, deductions, and net salary for every active
  employee for a selected period from a single page load, without expanding rows one at a
  time to trigger data to appear.
- **SC-002**: The number of data-loading operations needed to display salary figures for a
  selected period no longer grows with the number of active employees — it stays constant
  regardless of headcount.
- **SC-003**: Expanding any employee's row to view advance details happens with no visible
  loading delay, since the data was already retrieved with the summary.
- **SC-004**: Every salary figure and advance record shown after this change matches exactly
  what was shown before the change, for the same employee and period — no discrepancies
  introduced by the new loading approach.

## Assumptions

- The separate backend service exposes a way to retrieve salary summaries (and each
  employee's advances) for every employee for a given month/year together, with the same
  per-employee fields and values already documented for today's per-employee lookup; this
  mirrors the precedent already set by the existing bulk schedule/attendance lookup used on
  the Work Schedule tab. (Confirmed: the combined lookup returns every employee in the
  system, not just active ones — the Salário tab is still responsible for narrowing that down
  to active employees only, same as it does today with the plain employee list.)
- Only active employees are **displayed** in the Salário tab, consistent with the tab's
  current scope — this is a frontend-side filter, not something the combined lookup itself
  guarantees.
- This feature covers the HR-facing Salário tab only. The employee self-service salary
  summary view is out of scope and unaffected by this change.
- No visible change to the table layout, filters (month, year, employee), or expand/collapse
  interaction is introduced by this feature — only the underlying data-loading strategy
  changes.
- The API contract documentation for this combined lookup has since been written by hand in
  `specs/api/employees.md` ("Salary Summary (All Employees)") and is the authoritative source
  for its exact shape; see `data-model.md`/`contracts/salary-summary-overview.md` for how this
  feature's implementation reconciles with it.
