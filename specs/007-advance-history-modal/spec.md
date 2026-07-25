# Feature Specification: Employee Advance History View

**Feature Branch**: `007-advance-history-modal`

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "a new component or modal that wil show cleary and simply all
salaray advances for a specific customer, like a resume. I'm not sure where the place to
put, folloing the best UX pratices." Placement clarified with the user: triggered from a
"Ver histórico completo" entry point inside each employee's already-expanded row on the
Salário tab (chosen over adding it to the Funcionários tab, both tabs, or a new dedicated
employee-detail page).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review an employee's complete advance history (Priority: P1)

An HR user, while reviewing an employee's pay for the currently selected month on the
Salário tab, opens a focused view showing every salary advance ever recorded for that
employee — not just the ones in the currently selected month/year — so they can answer
"how much has this person taken in advances overall" without switching the period filter
back and forth or doing mental math across months.

**Why this priority**: This is the entire point of the request: today, the Salário tab only
ever shows advances for whichever single month/year is selected. There is no way to see an
employee's full advance history without repeatedly changing the period filter and adding
figures up by hand.

**Independent Test**: Can be fully tested by expanding an employee's row on the Salário tab,
clicking the new "Ver histórico completo" entry point, and confirming every advance ever
recorded for that employee appears — including ones from months other than the currently
selected period — with no need to change the period filter.

**Acceptance Scenarios**:

1. **Given** an employee has advances recorded across several different months, **When** HR
   expands that employee's row on the Salário tab and opens the advance history view,
   **Then** every one of that employee's advances appears, regardless of the month/year
   currently selected on the tab.
2. **Given** the advance history view is open, **When** HR reviews it, **Then** each advance
   shows its date, amount, and note (if one was recorded), ordered with the most recent
   advance first.
3. **Given** the advance history view is open, **When** HR reviews it, **Then** the total
   amount of all advances shown is displayed, without HR needing to add the figures up
   manually.
4. **Given** an employee has no advances recorded at all, **When** HR opens the advance
   history view for that employee, **Then** a clear "no advances recorded" message is shown
   instead of an empty or blank view.
5. **Given** the advance history view is open, **When** HR closes it, **Then** HR returns to
   the Salário tab exactly as it was — same selected period, same expanded row, same employee
   filter — with nothing reset.

---

### Edge Cases

- What happens when an employee has a very large number of recorded advances? The view must
  remain readable and usable (e.g., scrollable) rather than becoming cramped or overflowing
  the screen.
- What happens if the advance history fails to load? A clear error message with a retry
  option is shown, consistent with how other loading failures are handled elsewhere in the
  HR module, rather than a silent blank view.
- What happens to an advance with no note recorded? It still displays its date and amount;
  the note portion is simply omitted for that entry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow HR to open, from an employee's row on the Salário tab, a
  focused view showing that employee's complete salary advance history — every advance ever
  recorded for that employee, independent of whichever month/year is currently selected on
  the tab.
- **FR-002**: Each advance shown MUST display its date, its amount, and its note if one was
  recorded.
- **FR-003**: The advance history MUST be ordered with the most recent advance first.
- **FR-004**: The view MUST display the total amount of all advances shown, computed
  automatically.
- **FR-005**: If the employee has no advances recorded at all, the view MUST show a clear
  "no advances recorded" message rather than a blank or empty-looking view.
- **FR-006**: If the advance history fails to load, the view MUST show a clear error message
  with a retry option.
- **FR-007**: Closing the view MUST return HR to the Salário tab unchanged — the previously
  selected period, expanded row, and employee filter MUST all remain exactly as they were.
- **FR-008**: This view is read-only for this feature — creating, editing, or deleting an
  individual advance continues to happen through the Salário tab's existing period-scoped
  view, not from this new history view.

### Key Entities

- **Employee Advance History**: The complete, all-time collection of one employee's salary
  advances (each with a date, amount, and optional note), presented together in one view —
  distinct from the tab's existing period-scoped advance list, which only shows advances
  within the currently selected month/year.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: HR can view an employee's complete advance history in two actions or fewer from
  the Salário tab (expanding the row, then opening the history view), without changing the
  selected period.
- **SC-002**: HR can determine an employee's total lifetime advance amount at a glance,
  without performing any manual addition.
- **SC-003**: The view remains fully readable and usable for an employee with a large number
  of recorded advances, with no cramped or cut-off content.
- **SC-004**: Opening and closing the view never alters any other state on the Salário tab —
  100% of the time, the selected period, expanded row, and employee filter are unchanged
  afterward.

## Assumptions

- The data needed to show an employee's complete advance history (independent of month/year)
  is already available from the same underlying advance records the Salário tab already
  uses for its period-scoped view — this feature changes only how that data is presented and
  scoped for viewing, not what is tracked or stored.
- This view is reachable only for employees currently visible on the Salário tab (i.e.,
  active employees), consistent with the tab's existing scope — inactive employees are out of
  scope for this feature, matching the tab's current behavior.
- The view is presented as a focused overlay (modal), consistent with the modal patterns
  already used elsewhere in this app, rather than a new full-page or slide-over pattern.
- No printing or exporting capability is included — this is an on-screen summary only, not a
  downloadable or printable document.
- The Funcionários tab, a dedicated employee-detail page, and any other entry point besides
  the Salário tab row are explicitly out of scope for this feature (clarified with the user).
