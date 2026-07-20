# Feature Specification: HR Salary Tab

**Feature Branch**: `003-hr-salary-tab`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Refactor the HR component to rename tab Advances (Adiantamentos) to Salary (Salarios). Also this tab should be contextualized for salaries and will be possible to see the advanceds discounts and the lateness discounts. THe purpose now for this tab is show the current payment check for each employee. But the feature to add a new salary advance should be still there."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View current paycheck for each employee (Priority: P1)

An HR user opens the renamed "Salário" tab and immediately sees, for every active employee, their current-month payment check: gross salary, the discount from salary advances, the discount from lateness, and the resulting net salary.

**Why this priority**: This is the new core purpose of the tab. Without it, the rename and recontextualization deliver no value — HR still can't answer "what is each employee actually getting paid this month, and why."

**Independent Test**: Open the Salário tab with no filters applied and confirm every active employee is listed with gross, advance discount, lateness discount, and net figures for the current month, matching what the salary summary reports for each employee individually.

**Acceptance Scenarios**:

1. **Given** the HR user opens the Salário tab, **When** the tab loads, **Then** a paycheck summary (gross, advance discount, lateness discount, net) is shown for every active employee for the current month, with no filter selection required first.
2. **Given** the paycheck list is showing the current month, **When** the HR user changes the selected month/year, **Then** every employee's figures update to reflect that period.
3. **Given** an employee has no salary advances and no lateness deductions in the selected period, **When** their paycheck row is shown, **Then** the advance discount and lateness discount both display as zero, and net salary equals gross salary.

---

### User Story 2 - Inspect discount breakdown for an employee (Priority: P2)

An HR user wants to understand why a specific employee's net pay is lower than gross — they drill into that employee's paycheck to see the individual salary advances and the lateness detail (days late, minutes late) that make up the discounts.

**Why this priority**: Seeing a net figure without an itemized "why" doesn't satisfy the request to see "the advances discounts and the lateness discounts" — HR needs the breakdown, not just the total, to answer employee questions and catch errors.

**Independent Test**: From the paycheck list, select one employee and confirm the view shows their individual salary advance entries (amount, date, note) and their lateness detail (late days count, total minutes late) for the selected period, consistent with that employee's summary totals.

**Acceptance Scenarios**:

1. **Given** an employee has two salary advances in the selected period, **When** the HR user views that employee's discount breakdown, **Then** both advances are listed individually and their sum matches the advance discount shown in the paycheck summary.
2. **Given** the lateness configuration is enabled and the employee arrived late on 3 days in the selected period, **When** the HR user views that employee's discount breakdown, **Then** the lateness detail shows 3 late days and the total delay minutes, consistent with the lateness discount shown in the paycheck summary.
3. **Given** the lateness configuration has never been set up (or is disabled), **When** the HR user views any employee's discount breakdown, **Then** the lateness discount and detail show as zero/none rather than an error.

---

### User Story 3 - Register a new salary advance (Priority: P3)

An HR user still needs to record a new salary advance for an employee (amount, date, optional note, optional number of installments) from within the same tab, exactly as before the rename.

**Why this priority**: Explicitly called out by the request as a capability that must be preserved. It's P3 because the tab remains usable for its new primary purpose (viewing paychecks) even before this is verified, but the feature is not complete without it.

**Independent Test**: From the Salário tab, submit a new salary advance for an employee and confirm it appears in that employee's discount breakdown and is reflected in their paycheck's advance discount and net salary total.

**Acceptance Scenarios**:

1. **Given** the HR user is on the Salário tab, **When** they submit a valid new salary advance for an employee, **Then** the advance is saved and that employee's paycheck advance discount and net salary update to include it.
2. **Given** the HR user submits an advance split into multiple installments, **When** the submission succeeds, **Then** each installment appears as a separate entry in that employee's discount breakdown.
3. **Given** the HR user deletes an existing salary advance, **When** the deletion succeeds, **Then** that employee's paycheck advance discount and net salary update to no longer include it.

---

### Edge Cases

- What happens when an employee's paycheck is viewed for a month/year with no advances, no lateness deductions, and even no check-ins at all? All discount figures must show as zero, not as missing/blank/error.
- How does the system handle an inactive (deactivated) employee — are they still shown in the current paycheck list? (See Assumptions — excluded by default.)
- What happens if the lateness configuration is changed (e.g., re-enabled) while an HR user is viewing a period's paychecks? The displayed figures reflect whatever the configuration was at load/refresh time; no live recalculation is required while the view is open.
- How does the system handle a period where an employee had negative net salary (discounts exceeding gross salary)? The net salary figure must still display accurately (including as a negative number) rather than being clamped or hidden.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST rename the HR tab labeled "Adiantamentos" (Advances) to "Salário" (Salary).
- **FR-002**: The system MUST show, by default when the Salário tab is opened, a current-month paycheck summary for every active employee, without requiring the HR user to select a single employee first.
- **FR-003**: Each employee's paycheck summary MUST include: gross salary, total salary-advance discount, total lateness discount, and net salary for the selected period.
- **FR-004**: The system MUST allow the HR user to change the selected month/year, updating every employee's paycheck figures to that period.
- **FR-005**: The system MUST allow the HR user to view, per employee, the itemized salary advances that make up that employee's advance discount for the selected period.
- **FR-006**: The system MUST allow the HR user to view, per employee, lateness detail (at minimum: number of late days and total minutes late) that makes up that employee's lateness discount for the selected period.
- **FR-007**: The system MUST continue to allow the HR user to register a new salary advance for an employee (amount, date, optional note, optional number of installments) from within the Salário tab.
- **FR-008**: The system MUST continue to allow the HR user to delete an existing salary advance entry from within the Salário tab.
- **FR-009**: When a salary advance is added or removed, the affected employee's paycheck advance discount and net salary MUST reflect the change without requiring navigation away from the tab.
- **FR-010**: When the lateness configuration is disabled or has never been created, the system MUST display a lateness discount of zero (and empty/zero lateness detail) for every employee, rather than an error or missing state.
- **FR-011**: When an employee has no salary advances in the selected period, the system MUST display an advance discount of zero rather than an error or missing state.
- **FR-012**: Access to the Salário tab MUST be restricted to the same roles that currently access the HR area (Human Resources and Super Admin).

### Key Entities

- **Employee Paycheck**: A per-period, per-employee computed view combining gross salary, advance discount, lateness discount, and net salary. Not a new stored record — a reporting composition over existing Employee, Salary Advance, and Lateness Configuration data for a given month/year.
- **Salary Advance**: An existing record of money advanced to an employee ahead of payday (amount, date, optional note, optional installment count). Unchanged by this feature except for where/how it's surfaced.
- **Lateness Discount**: An existing computed deduction derived from an employee's late check-ins during a period and the system-wide lateness configuration (days late, minutes late, deducted amount). Newly surfaced in this tab; not newly computed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An HR user can see every active employee's current-month gross salary, advance discount, lateness discount, and net salary within one screen load of opening the Salário tab — no more than one navigation action (opening the tab) is required.
- **SC-002**: For any employee and period, the displayed net salary is always exactly gross salary minus advance discount minus lateness discount, with zero discrepancies across test scenarios.
- **SC-003**: An HR user can register a new salary advance and see it reflected in the affected employee's discount totals without leaving the Salário tab.
- **SC-004**: HR users familiar with the previous "Adiantamentos" tab can find the salary-advance creation feature in the redesigned "Salário" tab within a single click/interaction beyond opening the tab.

## Assumptions

- The "current payment check" default view shows the current calendar month/year, matching the existing default used by the salary summary elsewhere in the app, and can be changed via a month/year selector like the one already present.
- By default, the paycheck list includes only active employees; inactive (deactivated) employees are excluded from the default Salário view, consistent with them no longer earning salary. (This mirrors the existing employee-management table, which already distinguishes active/inactive.)
- The existing ability to delete an individual salary advance is preserved as part of the itemized discount breakdown (User Story 2 / FR-008), since the request does not say this capability should be removed.
- No backend changes are required: the existing `GET /employees/salary-summary/{employee_id}` and `GET /employees/salary-advances` endpoints already provide all data needed (gross salary, advance discount, lateness delay/days/deduction, net salary, itemized advances) — see API Contract Check notes.
- "Lateness discounts" in the paycheck view means the existing lateness-deduction figures already computed by the backend (per the Lateness Configuration feature); this feature does not change how lateness deductions are calculated, only where they're displayed.
