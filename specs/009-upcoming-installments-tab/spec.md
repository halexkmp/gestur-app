# Feature Specification: Upcoming Installments Tab

**Feature Branch**: `009-upcoming-installments-tab` *(branch not created by this command — no git hook is registered in `.specify/extensions.yml`)*

**Created**: 2026-08-10

**Status**: Draft

**Input**: User description: "based on the new endpoint to list he upcoming installments, create another tab on bugueiros component to show the next installments to be received. Implementa as a table with the relevant information. the only filters are date range and a flag to include the overdue installmentes."

## Overview

The Bugueiros page today answers two questions. The **Bugueiros** tab manages partners one at a time. The **Resumo** tab, added previously, answers "how much is the loan book scheduled to collect this period, and who accounts for it" — but only as totals, aggregated per partner.

Neither answers the question a manager asks when they are about to go collect money: **which specific installments are coming due, on what dates, from whom, and for how much.** Today that requires opening each partner's loan drawer and reading their installment schedules one by one.

This feature adds a third tab to the Bugueiros page: a row-level list of every installment still owed, ordered by due date, across all partners at once. Two controls scope it — a date range, and a switch that pulls in everything already overdue from before that range. The result is a working collection list: what is due, when, and how much of it is still outstanding.

This tab is the row-level companion to the Resumo tab. Resumo answers the same question as money; this tab answers it as rows.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what is coming due (Priority: P1)

A manager opens the Bugueiros page and switches to the upcoming-installments tab. Without touching any control, they see every installment still owed over the coming weeks, oldest due date first: the due date, which buggyman owes it, which installment of their loan it is, the scheduled amount, how much has already been paid against it, and how much is still outstanding. They adjust the date range and the list re-scopes.

**Why this priority**: This is the feature. It replaces reading each partner's schedule by hand, and it delivers value with nothing else built.

**Independent Test**: Open the tab with unpaid installments present in the system, confirm the list loads for the default range without input, confirm every row shows date/partner/amounts, and confirm changing the range re-scopes the list.

**Acceptance Scenarios**:

1. **Given** the user is on the Bugueiros page, **When** they select the upcoming-installments tab, **Then** the list loads for a default forward-looking range without requiring any input.
2. **Given** installments are due in the selected range, **When** the table renders, **Then** each row shows the due date, the partner's name, the installment's position within its loan, the scheduled amount, the amount already paid against it, the amount still outstanding, and its payment status.
3. **Given** the table is displayed, **When** the user reads it top to bottom, **Then** rows are ordered by due date ascending, and rows sharing a due date appear in a stable, repeatable order — grouped by loan, then by installment number within that loan. A partner holding several loans may have their same-date rows separated by another partner's; the ordering is by loan, not by partner.
4. **Given** the table is displayed, **When** the user changes the date range, **Then** the list refreshes for the new range, and once the refresh completes no row from the previous range remains on screen.
5. **Given** the table is displayed, **When** the user reads any row, **Then** the paid amount plus the outstanding amount equals that row's scheduled amount, and every money value is shown with currency formatting to two decimal places — including zero values.
6. **Given** an installment has been partially paid, **When** its row renders, **Then** it is visibly distinguished from an untouched installment and shows both what came in and what is still owed.
7. **Given** the range contains nothing still owed, **When** the list loads, **Then** an explicit "nothing due in this period" state is shown — visually distinct from both the loading state and the error state.
8. **Given** the data fails to load, **When** the error state appears, **Then** the user is told the list could not be loaded and is given a way to retry without leaving the tab.
9. **Given** the user selects an end date earlier than the start date, **When** the range is invalid, **Then** the user is warned inline and no request for an impossible range is made.

---

### User Story 2 - Pull in what is already overdue (Priority: P2)

The manager wants the full collection picture, not just what is ahead. They flip a single switch and the list additionally includes every installment still owed from before the selected range — no matter how far back. Overdue rows are unmistakable at a glance, and they sort to the top because they are the oldest.

**Why this priority**: Overdue debt is the most actionable part of a collection list, but P1 stands alone without it — the forward-looking list is already useful on its own.

**Independent Test**: With unpaid installments dated before the selected range, toggle the switch on and confirm those rows appear, are marked overdue, and sort above the in-range rows; toggle it off and confirm they disappear.

**Acceptance Scenarios**:

1. **Given** the overdue switch is off, **When** the list renders, **Then** every row's due date falls inside the selected range.
2. **Given** unpaid installments exist from before the selected range, **When** the user turns the overdue switch on, **Then** those installments are added to the list with no lower date cutoff, and they appear above the in-range rows by virtue of the due-date ordering.
3. **Given** overdue rows are present, **When** they render, **Then** each is visually marked as overdue in a way that does not depend on the user comparing dates themselves, and how long it has been overdue is discoverable from the row.
4. **Given** the overdue switch is on and the result includes a long history, **When** the list renders, **Then** the user is told how many rows are shown so a large result is not mistaken for the range being wrong.
5. **Given** the user turns the overdue switch off again, **When** the list refreshes, **Then** only in-range rows remain and the selected date range is unchanged.
6. **Given** the selected range starts in the past, **When** rows inside that range are themselves already past due, **Then** they are marked overdue regardless of the switch's position — the marking reflects the actual due date against today, not the range boundaries.
7. **Given** an installment falls due today, **When** its row renders, **Then** it is **not** marked overdue.

---

### User Story 3 - Act on a row (Priority: P3)

A row stands out — a large outstanding amount, or one long overdue. The manager opens that partner's loan detail straight from the row, inspects or registers payment against the installment, and comes back to the list with their range and overdue setting still applied.

**Why this priority**: Turns a reading surface into a working one. Genuinely useful, but the list has standalone value, and the partner loan detail already exists elsewhere on this page.

**Independent Test**: From a row, open the partner's loan detail, confirm it is the correct partner and loan, close it, and confirm the list returns with the same range, overdue setting, and scroll position.

**Acceptance Scenarios**:

1. **Given** the list is displayed, **When** the user opens a row's partner detail, **Then** the loan detail for that row's partner opens, showing the loan the installment belongs to.
2. **Given** the user is viewing a partner's loan detail opened from this tab, **When** they close it, **Then** they return to the list with the same date range, the same overdue setting, and the same rows.
3. **Given** the user registers a payment that fully settles an installment, **When** they return to the list and it refreshes, **Then** that installment no longer appears — the list shows only what is still owed.
4. **Given** the user registers a partial payment against an installment, **When** they return to the list and it refreshes, **Then** that row remains, with its paid and outstanding amounts updated.

---

### Edge Cases

- **Nothing owed in the range**: an explicit empty state, distinct from loading and from error. Not an error condition.
- **Overdue switch with no upper history bound**: turning the switch on has no lower date cutoff — the result can be far larger than the visible range implies. The row count must make the size of the result obvious.
- **Range starting in the past**: in-range rows can legitimately be overdue. Overdue marking is evaluated against today, independently of the range.
- **Due today**: not overdue. The boundary is strictly "before today".
- **Fully paid installments**: never appear, in any range, with the switch in either position. This list is what is still owed, not payment history.
- **Cancelled loans**: their installments never appear.
- **Inactive partners**: their installments *do* appear — an inactive partner can still owe money.
- **Partially paid installments**: appear, showing what came in and what remains.
- **Multiple loans for one partner**: each loan's installments appear as their own rows; the partner is not collapsed into a single row (that is what the Resumo tab does).
- **Invalid range** (end before start): warned inline, no request made.
- **Session expiry**: handled by the app's existing sign-out-and-redirect behaviour; the tab does not need its own handling.
- **Narrow screens**: the table must remain readable and horizontally scrollable within its own bounds — the page itself must never scroll sideways.
- **Cross-tab reconciliation**: the outstanding total shown here is not guaranteed to match the Resumo tab's outstanding figure for the same range. The two are derived from different records and can legitimately diverge for installments settled through a path that records no payment detail. The UI MUST NOT present the two as reconciling, and no requirement here depends on them agreeing.

## Requirements *(mandatory)*

### Functional Requirements

#### The tab

- **FR-001**: The Bugueiros page MUST offer a third tab, alongside the existing partner-management and period-summary tabs, presenting installments still owed as a row-level list.
- **FR-002**: The tab MUST be available to the same audience as the existing period-summary tab, and hidden from everyone else.
- **FR-003**: Selecting the tab MUST load data immediately using a default forward-looking date range, with no input required from the user.
- **FR-004**: Switching away from the tab and back MUST preserve the user's date range, overdue setting, and list state — the tab MUST NOT reset itself on every visit.
- **FR-005**: The existing partner-management and period-summary tabs MUST continue to behave exactly as they do today.

#### The table

- **FR-006**: Each row MUST show, at minimum: due date, partner name, the installment's position within its loan, scheduled amount, amount already paid against it, amount still outstanding, and payment status.
- **FR-007**: Rows MUST be ordered by due date ascending, with a stable, repeatable order among rows sharing a due date.
- **FR-008**: Every money value MUST be displayed with currency formatting to exactly two decimal places, including zero values.
- **FR-009**: Rows for partially paid installments MUST be visually distinguishable from rows for installments with nothing paid.
- **FR-010**: Rows for overdue installments MUST be visually marked as overdue, and how long they have been overdue MUST be discoverable from the row.
- **FR-011**: Overdue marking MUST be driven by the installment's due date relative to today, not by its position relative to the selected range. An installment due today MUST NOT be marked overdue.
- **FR-012**: The list MUST show the number of rows currently displayed, and the total amount still outstanding across them.
- **FR-013**: The outstanding total MUST be presented as a total of the rows on screen, and MUST NOT be labelled or presented as reconciling with the period-summary tab.
- **FR-014**: Fully settled installments MUST NOT appear in the list under any filter combination.
- **FR-015**: A partner with several loans MUST have each loan's installments listed as separate rows; rows MUST NOT be collapsed per partner.
- **FR-016**: The table MUST remain readable on narrow screens, scrolling horizontally within its own bounds without causing the page to scroll sideways.

#### The filters

- **FR-017**: The tab MUST expose exactly two filters: a date range, and a switch to include overdue installments. No other filter (partner, status, amount, row cap) is in scope.
- **FR-018**: The date range MUST require both a start and an end date, and MUST offer quick presets alongside manual date entry, consistent with the range control already used on the period-summary tab.
- **FR-019**: When the end date is earlier than the start date, the user MUST be warned inline and no data request MUST be made for that range.
- **FR-020**: With the overdue switch off, every row's due date MUST fall inside the selected range.
- **FR-021**: With the overdue switch on, the list MUST additionally include every installment still owed with a due date before the range start, with no lower cutoff.
- **FR-022**: Changing either filter MUST refresh the list. While the refresh is in flight, rows from the previous filter state MAY remain on screen provided they are visually marked as stale; once it completes, no row from the previous filter state may remain.

#### States and interaction

- **FR-023**: The tab MUST present distinct loading, empty, error, and populated states — the empty state MUST be distinguishable from both loading and error.
- **FR-024**: On failure, the user MUST be shown a clear message and offered a retry without leaving the tab.
- **FR-025**: Users MUST be able to open the loan detail for a row's partner directly from that row, and return to the list with their filters and rows intact.
- **FR-026**: After a payment is registered through that detail view, a refreshed list MUST reflect the new state — the installment disappearing if fully settled, or its paid and outstanding amounts updating if partially settled.

### Key Entities

- **Owed installment (row)**: one unsettled installment of one partner's loan. Carries the due date, the owing partner, its position within its loan, the scheduled amount, the amount received against it so far, the amount still outstanding, its payment status, and whether it is past due. Uniquely identified; never appears twice in one list.
- **Collection window**: the start and end date bounding which installments are listed, plus the switch determining whether installments predating the window are included.
- **Partner**: the buggyman who owes the installment. Identified by name in the list; the link back to their full loan detail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager can determine everything owed over the next 30 days across all partners in under 10 seconds from opening the Bugueiros page, with no filtering or data entry.
- **SC-002**: Answering "what is overdue right now, and by whom" takes a single interaction (one switch) after opening the tab, replacing what today requires opening every partner's loan detail in turn.
- **SC-003**: 100% of rows displayed represent money still owed — no fully settled installment ever appears.
- **SC-004**: Overdue rows are identifiable without reading or comparing any date: a user shown the list can pick out every overdue row from visual marking alone.
- **SC-005**: For every row, the paid and outstanding amounts add up to the scheduled amount, verifiable by inspection on screen.
- **SC-006**: The default view is useful without configuration — a first-time user sees real data on arrival rather than an empty state prompting them to pick a range.
- **SC-007**: Changing either filter produces an updated list, or an explicit empty state, within 2 seconds under normal conditions.
- **SC-008**: The list stays readable with several hundred rows — as happens when overdue history is included — without the page scrolling sideways and without the user losing the column headers while scrolling.
- **SC-009**: The tab reaches parity with manual inspection: for a given partner and range, the rows shown match that partner's unsettled installments in their loan detail, with zero discrepancies.

## Assumptions

- **Audience matches the Resumo tab**: this tab exposes the whole loan book across all partners, the same class of data as the existing period-summary tab, which is restricted to super admins. This tab is assumed to carry the same restriction. If it should instead be visible to every user who can reach the Bugueiros page, that changes FR-002 and needs to be stated.
- **Default range is the next 30 days**, not the current month. Unlike the Resumo tab — which reports on a period, and so defaults to the current month — this tab is forward-looking: its job is "what is coming". A "next 30 days" preset already exists in the range control used by the Resumo tab.
- **The overdue switch defaults to off.** The tab opens on the forward-looking question; overdue history is opt-in, because turning it on can return an unbounded amount of history.
- **No row cap is exposed to the user.** The user asked for exactly two filters, so no "show N rows" control is offered. The list is expected to render whatever matches; FR-012's row count exists so a large result is legible rather than surprising.
- **No new payment flow is introduced.** Registering payment happens through the partner loan detail that already exists on this page; this tab links into it rather than duplicating it.
- **The tab reads only.** No creating, editing, or deleting of loans or installments happens here.
- **Interface language is Portuguese**, consistent with the rest of the Bugueiros page.
- **The backing data already exists.** The endpoint serving this list is documented and live in the API contract; no backend work is assumed or required.
- **Amounts are trusted as served.** Per-row arithmetic, capping of overpayments, ordering, and the overdue determination are all computed server-side and are treated as authoritative rather than recomputed client-side.
- **Currency is BRL**, formatted as elsewhere in the application.
