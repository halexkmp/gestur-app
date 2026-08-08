# Feature Specification: Partner Loan Period Dashboard

**Feature Branch**: `feature/008-partner-loan-dashboard` *(not yet created — no git hook is registered in `.specify/extensions.yml`; work is currently on `feature/006-salary-bulk-summary`)*

**Created**: 2026-08-08

**Status**: Draft

**Input**: User description: "based on new endpoint for partner loan which summarize the loans returning the revenue, profits, and more information about the partners will pay. Implement a new tab on Bugueiros which will show this dashboard, filter by date range. Using the best practices of UX design and provide a useful dash based on the information provided."

## Overview

The Bugueiros (buggyman partners) area today is a management list: create, edit, delete a partner, and open a drawer to inspect one partner's loans. There is no way to see the loan book as a whole. To answer "how much are we due to collect this month, how much of that is profit, how much has actually come in, and who still owes us", a manager has to open each partner's drawer one at a time and add it up by hand.

This feature adds a second tab to the Bugueiros page — a period dashboard. The user picks a date range and sees, for every buggyman at once, what is scheduled to be collected in that range, how that total splits into returned capital and profit, how much has been received, how much is still outstanding, and a per-partner breakdown of who accounts for it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the period totals (Priority: P1)

A manager opens the Bugueiros page and switches to the summary tab. Without touching any control, they see the totals for the current month: how much is scheduled to be collected, how much of that is capital coming back versus profit earned, how much has already been received, and how much is still outstanding. They change the range to the previous month and every figure updates to match.

**Why this priority**: This is the core of the feature and delivers value on its own. Even with nothing else built, it replaces the manual per-partner tallying that exists today.

**Independent Test**: Open the summary tab with loans present in the system, confirm the headline figures match the period summary for the default range, change the range, and confirm every figure updates consistently.

**Acceptance Scenarios**:

1. **Given** the user is on the Bugueiros page, **When** they select the summary tab, **Then** the dashboard loads for a default range of the current month without requiring any input.
2. **Given** the dashboard is showing a period with loan activity, **When** the user reads the headline figures, **Then** expected revenue, returned capital, profit, received amount, and outstanding amount are all displayed with currency formatting, along with the number of installments and the number of partners involved.
3. **Given** the dashboard is loaded, **When** the user selects a different date range, **Then** all figures refresh for the new range and no figure from the previous range remains on screen.
4. **Given** the totals are displayed, **When** the user compares them, **Then** capital plus profit visibly reconciles to expected revenue, and received plus outstanding visibly reconciles to expected revenue.
5. **Given** a range in which nothing is scheduled, **When** the dashboard loads, **Then** an explicit "no installments due in this period" state is shown — visually distinct from both the loading state and an error state.
6. **Given** the data fails to load, **When** the error state appears, **Then** the user is told the summary could not be loaded and is given a way to retry without leaving the tab.

---

### User Story 2 - See who owes what (Priority: P2)

Having read the totals, the manager wants to know which partners make them up. Below the totals, a per-partner breakdown lists each buggyman with installments due in the range, how much they are scheduled to pay, how much they have already paid, how much they still owe, and how far along their collection is. The heaviest debtors appear first by default. The manager can type a name to narrow the list.

**Why this priority**: Turns an aggregate number into an actionable collection list. Valuable, but the totals in P1 stand alone without it.

**Independent Test**: With several partners holding loans due in the range, open the tab and confirm each partner appears once with correct amounts, ordered largest-scheduled-first, and that the per-partner amounts sum to the headline totals.

**Acceptance Scenarios**:

1. **Given** several partners have installments due in the selected range, **When** the breakdown renders, **Then** each partner appears exactly once — with loans combined — showing name, installment count, scheduled amount, received amount, and outstanding amount.
2. **Given** the breakdown is displayed, **When** the user inspects the default order, **Then** partners are ordered by scheduled amount descending, with ties broken alphabetically by name.
3. **Given** the breakdown is displayed, **When** the user sums the per-partner scheduled amounts, **Then** the total equals the headline expected revenue; the same holds for received amounts.
4. **Given** a partner has fully paid everything due in the range, **When** their row renders, **Then** it shows zero outstanding and is visually marked as settled rather than being hidden.
5. **Given** the user types part of a partner's name into the breakdown's search, **When** the list filters, **Then** only matching partners remain and the headline totals stay unchanged — filtering the list does not re-scope the period totals.
6. **Given** many partners are listed, **When** the breakdown is displayed, **Then** the list remains readable and navigable without the page scrolling sideways.

---

### User Story 3 - Drill into a partner from the dashboard (Priority: P3)

A partner stands out in the breakdown for a large outstanding amount. The manager opens that partner's loan detail directly from the row, inspects the individual installments, and returns to the dashboard with the same date range still applied.

**Why this priority**: A convenience that shortens the path from "who owes" to "what exactly they owe". The dashboard is fully useful without it.

**Independent Test**: Click a partner row in the breakdown, confirm the existing per-partner loan detail opens for that partner, close it, and confirm the dashboard is unchanged and still on the same range.

**Acceptance Scenarios**:

1. **Given** the breakdown is displayed, **When** the user activates a partner row, **Then** the existing per-partner loan detail view opens for that partner.
2. **Given** the loan detail is open from the dashboard, **When** the user closes it, **Then** they return to the summary tab with the previously selected date range still applied and the data still loaded.
3. **Given** a partner in the breakdown is inactive, **When** the user activates their row, **Then** the loan detail still opens — inactive partners with outstanding debt remain inspectable.

---

### Edge Cases

- **End date before start date**: the user is told inline and no lookup is attempted; the previously loaded figures are not replaced by an error.
- **Empty period**: zero installments due is a legitimate result, not a failure — all figures read zero and the breakdown shows an explicit empty state.
- **Zero expected revenue**: any percentage or ratio (e.g. share collected) is shown as a neutral placeholder rather than a misleading `0%` or a broken value.
- **Rapid range changes**: if the user changes the range several times quickly, only the result for the range currently selected is displayed; a slower earlier response never overwrites a newer one.
- **Very wide range**: a multi-year range returns a large partner list; the breakdown must stay usable, since the underlying data arrives in full with no server-side paging.
- **Partner appearing with multiple loans**: figures are combined into a single row, never duplicated.
- **Inactive partners**: included in totals and breakdown — deactivating a partner does not erase their debt.
- **Canceled loans**: excluded from every figure.
- **Fully paid loans**: still counted, and land in the received amount rather than disappearing.
- **Payment made outside the period**: still counts as received when the installment it settles is due inside the period. Labels must not imply "received during this period".
- **Cent-level reconciliation**: the period figures are built from individual installments, so summing several periods will not always match a loan's own total to the cent. The dashboard must not present cross-view equality as a guarantee.
- **Session expiry mid-view**: handled by the application's existing sign-out behaviour, not by a dashboard-specific message.

## Requirements *(mandatory)*

### Functional Requirements

#### Navigation and access

- **FR-001**: The Bugueiros page MUST present its content as two tabs: the existing partner management list and a new period summary dashboard.
- **FR-002**: The partner management list MUST remain the tab shown on first entry, with all of its current behaviour (search, "only with loans" filter, create, edit, delete, per-partner loans) unchanged.
- **FR-003**: The summary tab MUST be visible only to users who are already permitted to see partner loan information; users who cannot see loans today MUST NOT see the tab at all.
- **FR-004**: The selected tab MUST persist while the user stays on the Bugueiros page, so switching tabs and back does not reset the dashboard's date range.

#### Date range filter

- **FR-005**: The dashboard MUST provide a date range filter with an explicit start date and end date, both always populated.
- **FR-006**: The dashboard MUST default to the current calendar month on first open, and MUST load data for that default without the user selecting anything.
- **FR-007**: The filter MUST offer quick presets for at least: current month, previous month, current quarter, current year, and next 30 days, alongside free custom date entry.
- **FR-008**: The dashboard MUST prevent submitting a range whose end date is earlier than its start date, showing an inline validation message instead of attempting a lookup.
- **FR-009**: The currently applied range MUST be stated in plain language on screen, so every figure is unambiguously attributed to a period.
- **FR-010**: Changing the range MUST refresh every figure on screen together; the dashboard MUST NOT display figures from two different ranges at once.

#### Headline figures

- **FR-011**: The dashboard MUST display, for the selected range: expected revenue, expected returned capital, expected profit, amount received, and amount outstanding.
- **FR-012**: The dashboard MUST display the number of installments due in the range and the number of partners with installments due in the range.
- **FR-013**: Every monetary figure MUST be displayed in Brazilian Real formatting with two decimals.
- **FR-014**: Each figure MUST carry a label that states its meaning without requiring outside knowledge — in particular, that revenue is what is *scheduled* to be collected in the period based on installment due dates, not what was transacted in the period.
- **FR-015**: The dashboard MUST visually convey the split of expected revenue into capital and profit, and the split of expected revenue into received and outstanding, so the relationship between the figures is readable at a glance rather than requiring mental arithmetic.
- **FR-016**: The dashboard MUST show the proportion of expected revenue already received as a percentage, and MUST render a neutral placeholder instead of a percentage when expected revenue is zero.
- **FR-017**: Figures MUST be visually prioritised, with expected revenue, received, and outstanding given more prominence than counts and secondary breakdowns.

#### Per-partner breakdown

- **FR-018**: The dashboard MUST list every partner with installments due in the selected range, showing partner name, installment count, scheduled amount, received amount, and outstanding amount.
- **FR-019**: Each partner MUST appear exactly once, with amounts from all of their loans combined.
- **FR-020**: The breakdown MUST default to ordering by scheduled amount descending, with alphabetical name ordering as the tiebreak.
- **FR-021**: The breakdown MUST let the user re-order by at least scheduled amount, outstanding amount, and partner name.
- **FR-022**: The breakdown MUST provide a name search that narrows the listed partners without altering the headline figures.
- **FR-023**: Each row MUST indicate collection progress for that partner, and MUST visually distinguish a fully settled partner from one still owing.
- **FR-024**: The breakdown MUST remain readable on small screens, reflowing rather than forcing the page to scroll horizontally.
- **FR-025**: Activating a partner row MUST open that partner's existing loan detail view; closing it MUST return the user to the dashboard with the same range and data intact.

#### States and feedback

- **FR-026**: The dashboard MUST show a loading state while data is being fetched, structured so the layout does not jump when data arrives.
- **FR-027**: The dashboard MUST show a distinct empty state when the range contains no installments, explaining that nothing is due in the selected period and inviting the user to widen the range.
- **FR-028**: The dashboard MUST show a distinct error state when the summary cannot be loaded, with a retry action that does not require leaving or reloading the page.
- **FR-029**: When a refresh is triggered by a range change, the dashboard MUST indicate that a refresh is in progress rather than silently showing stale figures.
- **FR-030**: All user-facing text MUST be in Brazilian Portuguese, consistent with the rest of the application.

### Key Entities

- **Period Summary**: the aggregate result for one date range — expected revenue, expected capital, expected profit, received amount, outstanding amount, installment count, partner count, and the range itself. Capital plus profit equals expected revenue; received plus outstanding equals expected revenue.
- **Partner Period Entry**: one buggyman's share of a period summary — partner identity and name, scheduled amount, received amount, outstanding amount, and installment count. Scheduled equals received plus outstanding. All entries together sum to the period summary.
- **Date Range**: an inclusive start and end date bounding which installments are counted, matched against installment due dates.
- **Partner (existing)**: the buggyman being reported on; the bridge from a breakdown row into the existing loan detail view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager can answer "how much is due, how much came in, how much is still owed, and how much of it is profit" for any period without leaving the tab, opening a partner record, or doing arithmetic of their own.
- **SC-002**: Reaching the current month's totals from the Bugueiros page takes at most one interaction (selecting the tab), and reaching any other common period takes at most two.
- **SC-003**: The dashboard presents readable figures within 2 seconds of the tab being opened under normal conditions.
- **SC-004**: Changing the date range updates every figure within 2 seconds, and at no point is a figure from a previous range shown alongside one from the new range.
- **SC-005**: The five partners with the largest scheduled amounts are identifiable with zero sorting or filtering actions.
- **SC-006**: The four states — loading, populated, empty period, and load failure — are distinguishable at a glance; an empty period is never mistaken for a failure in usability testing.
- **SC-007**: The dashboard is fully usable at 360px width with no horizontal scrolling of the page.
- **SC-008**: Zero lookups are attempted with an end date earlier than the start date; the condition is caught before submission in 100% of attempts.
- **SC-009**: Replacing the current manual method — opening each partner's loans individually — reduces the work of producing a monthly collection picture from several minutes to under 30 seconds.
- **SC-010**: All existing Bugueiros management functionality continues to work unchanged after the tabs are introduced, with no regression in the partner list, search, filter, or create/edit/delete flows.

## Assumptions

- **Access control mirrors the existing loans gate — CONFIRMED (2026-08-08).** The summary tab is restricted to super administrators, matching the existing restriction on partner loan detail. The backend does not enforce a role on this data, so this is a product decision rather than a technical constraint.
- **The dashboard surface itself is read-only.** No paying, editing, or creating from the dashboard. Its one outbound action is opening the existing per-partner loan detail, which retains its own actions — including registering a new loan — unchanged.
- **Default range is the current calendar month**, as the closest match to how collection is reviewed in practice. No other default was specified.
- **The breakdown covers only partners with installments due in the range.** Partners with no scheduled installments in the period are absent rather than listed as zero rows — the list is a collection worklist, not a partner roster.
- **No per-partner capital/profit split is shown.** The capital and profit split is available only at the aggregate level, so the breakdown reports scheduled, received, and outstanding only.
- **Cross-view exact reconciliation is not promised.** Because the figures are derived from individual installments, the dashboard does not claim that summing periods will match a loan's own total to the cent, and no UI asserts that equality.
- **The whole partner list arrives at once.** There is no server-side paging, so any handling of long lists (search, sorting, progressive display) is a client-side concern.
- **Monetary values arrive as fixed two-decimal strings**, so any client-side aggregation or comparison must treat them as exact decimal values rather than approximations.
- **No export.** Downloading or printing the summary is out of scope for this iteration.
- **No historical comparison.** Period-over-period deltas, trends, and charts over time are out of scope; the dashboard describes exactly one range at a time.
- **Existing per-partner loan detail is reused as-is**, not redesigned as part of this feature.
