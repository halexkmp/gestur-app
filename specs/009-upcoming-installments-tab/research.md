# Phase 0 Research: Upcoming Installments Tab

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-08-10

No `NEEDS CLARIFICATION` markers were carried into the Technical Context. The unknowns worth resolving before implementation are behavioral, not technological — the stack is fixed by the existing codebase, and the endpoint is already documented and live. Each decision below was checked against real code in this repo or against `specs/api/loans.md`, not assumed.

---

## R-001 — Sending `include_overdue` through the API client

**Decision**: Pass `include_overdue` as a plain boolean in the `params` object. Always send it, including when `false`.

**Rationale**: `src/lib/api.ts` serializes params with `value.toString()`, guarded by `value !== undefined && value !== null && value !== ''`. A boolean `false` passes that guard and serializes to the string `"false"` — it is *not* dropped. FastAPI parses `"true"`/`"false"` into a bool, so both states transmit correctly. Sending it explicitly in both states keeps the request URL self-describing and makes the hook's assertions in tests exact.

**Alternatives considered**:
- *Omit the param when false, relying on the server default.* Works, since the contract defaults `include_overdue` to `false`. Rejected because it makes the request depend on a server-side default for a user-visible filter, and makes the test assertion for the "off" state weaker (asserting absence rather than value).
- *Serialize to `"1"`/`"0"` manually.* Rejected — unnecessary; the client already produces a form the backend accepts.

**Watch out**: the same guard drops empty string and `null`. Do not model "no overdue filter" as `''`.

---

## R-002 — Summing money that arrives as decimal strings

**Decision**: Sum in integer cents. Convert each `remaining_amount` with `Math.round(Number(value) * 100)`, accumulate as integers, and divide by 100 once at the end. Compute this inside `useUpcomingInstallments`, not in a component.

**Rationale**: FR-012 requires a total outstanding across displayed rows. The API sends money as strings (`"1234.50"`), and naive float accumulation produces visible artifacts — `0.1 + 0.2 === 0.30000000000000004`, and with a few hundred rows the drift can surface a trailing cent in a currency-formatted total. Rounding each value to cents *before* accumulating is safe because the contract guarantees exactly two decimals on every money field, so `Number(v) * 100` is within one rounding of an integer and never accumulates error. Placing the computation in the hook satisfies Principle I (logic in hooks, not components) and makes it directly unit-testable without rendering.

**Alternatives considered**:
- *`values.reduce((a, v) => a + Number(v), 0)`.* Simplest, and the existing `PartnerProgress` gets away with float math because it only computes a percentage width where sub-cent error is invisible. Rejected here because this total is displayed as currency, where it is not invisible.
- *A decimal library (`decimal.js`, `dinero.js`).* Rejected outright — Principle V forbids new dependencies without explicit request, and a single-column sum of 2dp values does not warrant one.
- *Ask the backend for the total.* The endpoint returns a flat array with no envelope; there is no total to read. The period-summary endpoint has one, but per FR-013 the two are not interchangeable (see R-005).

---

## R-003 — Determining and displaying how overdue a row is

**Decision**: Trust the server's `is_overdue` boolean for *whether* a row is overdue. Compute *how long* client-side with a new `daysOverdue(dueDate: string): number` helper in `src/lib/formatters.ts`, parsing at local noon and diffing whole days.

**Rationale**: FR-011 is explicit that overdue state is the server's determination against its own clock, evaluated independently of the selected range — a range starting in the past can legitimately return in-range rows flagged overdue, and an installment due today is *not* overdue. Recomputing the flag client-side would risk disagreeing with the server across timezone boundaries. But the flag alone does not satisfy FR-010's "how long it has been overdue must be discoverable", and the response carries no age field, so the duration must be derived from `due_date`.

Parsing at local noon (`new Date(\`${date}T12:00:00\`)`) is the technique already used by `formatDateBR` in this file, and it is what keeps a whole-day diff correct across DST transitions — a midnight anchor can land an hour either side of a day boundary. Diffing against today's local midnight-anchored date keeps "due today" at exactly 0.

**Alternatives considered**:
- *Derive `is_overdue` client-side as `due_date < today`.* Rejected — contradicts FR-011 and would drift from the server's clock.
- *Show the raw due date only, no duration.* Rejected — fails FR-010.
- *`date-fns` / `dayjs`.* Rejected — new dependency for one whole-day diff; the codebase already hand-rolls its date helpers in `lib/formatters.ts`.

---

## R-004 — Default range and preset reuse

**Decision**: Reuse `PeriodRangeFilter` unchanged, with `next-30-days` as this tab's default preset.

**Rationale**: The `next-30-days` preset already exists in `periodPresetRange` and is already rendered by `PeriodRangeFilter` (it is offered on the Resumo tab too), so the default costs one constant and no new UI. It matches the tab's forward-looking purpose and satisfies SC-006 (useful without configuration) and FR-003. The Resumo tab's `current-month` default is right for a *reporting* view and wrong for a *collection* view.

The preset component is genuinely reusable as-is: it is fully controlled, takes `startDate`/`endDate`/`preset`/`invalidRange` plus two callbacks, and holds no summary-specific state.

**Alternatives considered**:
- *Default to `current-month` for consistency with Resumo.* Rejected — on the 28th of a month it would show three days of work and hide everything imminent.
- *Add a "next 7 days" preset.* Rejected as scope creep; FR-017 fixes the filter set at two, and the manual date inputs already cover it.

---

## R-005 — Not reconciling with the Resumo tab

**Decision**: Label the total as belonging to the rows on screen (e.g. "Total em aberto (N parcelas)"), and add no cross-tab comparison anywhere in the UI.

**Rationale**: `specs/api/loans.md` documents a real divergence between the two endpoints. There are two write paths for settling an installment: `POST /loan-installments/{id}/payments` writes a payment row and updates status, while `PATCH /loan-installments/{id}/pay` sets status to `PAID` **without** writing a payment row. The upcoming-installments endpoint trusts status and drops such an installment; the period summary derives `received_amount` from payment rows only and still counts it as outstanding. The two totals therefore differ by exactly those amounts, and this is a pre-existing disagreement between the write paths — not something either read endpoint, or this UI, can fix.

Note that `loanService.payInstallment` in this codebase uses the `PATCH .../pay` path, so this divergence is reachable in production today, not hypothetical.

**Alternatives considered**:
- *Show both totals side by side.* Rejected — actively invites the user to spot a mismatch the UI cannot explain.
- *Reconcile client-side.* Impossible; the discrepancy lives in data neither endpoint exposes.
- *Say nothing and let the labels imply equivalence.* Rejected — that is exactly what FR-013 forbids.

---

## R-006 — Keeping filter state across tab switches

**Decision**: Extend `Buggyman.tsx`'s existing mount-once-then-hide pattern to three tabs by replacing the `summaryVisited` boolean with a `Set<BuggymanTab>` of visited tabs.

**Rationale**: FR-004 requires the range, overdue switch, and list state to survive leaving and re-entering the tab. `Buggyman.tsx` already solves this for the Resumo tab — it mounts on first visit and thereafter stays mounted behind a `hidden` class, with an in-code comment explaining that unmounting would reset the range. A second parallel boolean would work but reads poorly and invites a third; a visited-set expresses the same intent once and keeps the file under 80 lines.

**Alternatives considered**:
- *Add `upcomingVisited` alongside `summaryVisited`.* Smaller diff, but duplicates the pattern per tab.
- *Lift filter state into `Buggyman.tsx` or a context.* Rejected — over-engineered for one tab's local state, and it would spread loan concerns into the page shell.
- *Persist filters to `localStorage`.* Rejected — not requested, and the spec only requires survival across tab switches, not across sessions.

---

## R-007 — Reusing the drill-through drawer

**Decision**: Widen `usePartnerLoanDrawer`'s `openFor` parameter from `LoanPeriodSummaryPartner` to a structural `{ partner_id: string }`, and reuse the hook and `LoanDrawer` as-is.

**Rationale**: The hook already does the hard part — it resolves a partner id into the full `Partner` object `LoanDrawer` requires, preloading the buggyman list and falling back to `GET /partners/{id}`. Its body reads only `row.partner_id`. Because TypeScript is structural, `LoanPeriodSummaryPartner` remains assignable to the widened parameter, so `SummaryTab`'s existing call site compiles and behaves identically — this is a type-level change with no runtime effect, which is what keeps it inside Principle V's "minimal and scoped".

This satisfies FR-025 and FR-026 with no new drawer, no new payment flow, and no duplicated partner-resolution logic.

**Alternatives considered**:
- *Construct a `LoanPeriodSummaryPartner`-shaped object from an installment row.* Rejected — would require inventing `scheduled_amount`, `received_amount`, `outstanding_amount` and `installments_count` values that mean nothing for a single row; the hook's own doc comment warns against fabricating partial objects.
- *A second, near-identical hook for installment rows.* Rejected — straight duplication.

---

## R-008 — Table at scale, and on small screens

**Decision**: Render the desktop table inside a bounded scroll container with a `sticky top-0` header row, and a stacked card list below the `sm` breakpoint. No virtualization.

**Rationale**: SC-008 requires several hundred rows to stay readable "without the page scrolling sideways and without the user losing the column headers while scrolling" — that is a sticky header plus `overflow-x-auto` scoped to the table wrapper, which is exactly the `hidden sm:block overflow-x-auto` + `sm:hidden` card-list split already used by `PartnerBreakdownTable`/`PartnerBreakdownCards`. Following it keeps the two tabs visually consistent (Principle V) and inherits an already-solved mobile layout.

Virtualization is rejected: a few hundred unvirtualized rows render acceptably, the existing breakdown table sets the precedent, and a windowing library would be a new dependency (Principle V) whose absolute positioning fights sticky headers and native table semantics.

**Alternatives considered**:
- *Client-side pagination.* Rejected — FR-017 fixes the control set at two filters, and a page control is a third.
- *Cap rows via the endpoint's `limit` parameter.* Rejected — the spec's Assumptions explicitly exclude a user-facing cap, and silently truncating a collection list is worse than a long one. `limit` stays unused; the row count in the summary bar (FR-012) is what makes a large result legible.

---

## R-009 — Test strategy

**Decision**: Unit-test the hook (`useUpcomingInstallments.test.ts`) and the new formatter (`daysOverdue` cases added to `formatters.test.ts`). No component tests.

**Rationale**: This mirrors 008, which shipped `useLoanPeriodSummary.test.ts` and no component tests, and it matches the constitution — tests are supported but not required for every change, with the hook being where the logic actually lives. The hook carries all the behavior worth pinning: default range, the inverted-range guard, the overdue toggle round trip, stale-response discarding, error surfacing, and the cents-based total from R-002.

`useLoanPeriodSummary.test.ts` is the direct template, including its notable constraint: **derive expected ranges at runtime via `periodPresetRange` rather than freezing time**, because fake timers stall `waitFor`'s polling. Exhaustive preset boundary maths belongs in `formatters.test.ts`, where time *is* frozen.

Baseline to measure against: `1 failed | 7 passed`. The failure is `useEmployeePaychecks.test.ts` asserting a hardcoded `month: 7` — pre-existing, date-dependent, unrelated. Any second failure is caused by this work.

**Alternatives considered**:
- *Testing-Library component tests for the table.* Rejected for now — no precedent in this repo for component tests, and the rendering is straightforward mapping over rows.
- *No tests at all.* Rejected — the money-summing and overdue-day logic are precisely the kind of arithmetic that regresses silently.

---

## Summary of decisions

| ID | Decision | Primary driver |
|---|---|---|
| R-001 | Send `include_overdue` explicitly in both states | `api.ts` param serialization |
| R-002 | Sum money in integer cents, inside the hook | FR-012, float drift, Principle I |
| R-003 | Trust server `is_overdue`; compute duration via new `daysOverdue` | FR-010, FR-011 |
| R-004 | Reuse `PeriodRangeFilter`; default `next-30-days` | FR-003, SC-006, Principle V |
| R-005 | Never present the total as reconciling with Resumo | FR-013, documented API divergence |
| R-006 | Visited-set in `Buggyman.tsx` for mount-once tabs | FR-004 |
| R-007 | Widen `openFor` to `{ partner_id: string }` | FR-025, FR-026, Principle V |
| R-008 | Sticky header + scroll container + mobile cards, no virtualization | SC-008, FR-016 |
| R-009 | Hook + formatter unit tests, no component tests | Constitution, 008 precedent |
