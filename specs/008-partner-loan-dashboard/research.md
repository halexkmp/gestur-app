# Phase 0 Research: Partner Loan Period Dashboard

All Technical Context unknowns resolved. No `NEEDS CLARIFICATION` remains.

---

## R1 — Money is a string, and the codebase's existing formatter is wrong for strings

**Decision**: Type every monetary field on the new models as `string`. Add a single shared `formatCurrency(value: string | number): string` to `src/lib/formatters.ts` that coerces with `Number()` before `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`. Use it in all new components. Do **not** retrofit existing components in this feature.

**Rationale**: `specs/api/shared.md` defines Money as "Decimal represented as string", and `specs/api/loans.md` guarantees every money field on this endpoint carries two decimals including zeros (`"0.00"`, never `"0"`). The existing per-component helpers are subtly broken for that shape:

```ts
// src/components/LoanCard.tsx:33-35 — amount is `string | number`
const formatCurrency = (amount: string | number) =>
  amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
```

`String.prototype.toLocaleString` takes no arguments — it ignores the options object entirely and returns the string unchanged. So a string amount renders as `1234.50` rather than `R$ 1.234,50`. `InstallmentList.tsx:23` and `InstallmentPaymentsRow.tsx:89` type their parameter as `number` and are safe only because their inputs happen to be numbers today. Since **every** field this feature displays is a string, copying that pattern would break the entire dashboard's formatting.

`lib/` is where Constitution I places stable utilities, so a shared helper there is the correct home rather than a seventh local copy.

**Alternatives considered**:
- *Coerce to `number` at the service boundary* — rejected: loses the API's exact decimal representation, and diverges from the existing `LoanSummary` type, which already models money as `string`.
- *Fix all existing `formatCurrency` copies now* — rejected: Constitution V forbids refactoring unrelated code as a side effect. Worth a separate follow-up; noted below.

**Follow-up (out of scope)**: `LoanCard.tsx` displays `LoanSummary` string fields through the broken helper — a real, pre-existing display bug on the loans drawer, worth its own task.

---

## R2 — No client-side aggregation

**Decision**: Every headline figure is rendered straight from a response field. The only computed value in the whole feature is the collection percentage.

**Rationale**: The contract already guarantees `expected_capital + expected_profit == expected_revenue`, `received_amount + outstanding_amount == expected_revenue`, `sum(partners[].scheduled_amount) == expected_revenue`, and `sum(partners[].received_amount) == received_amount`. Re-deriving any of these client-side would introduce float drift against server-computed decimals and would silently disagree with the backend at the cent level. Summing decimal strings in JS floats is exactly the class of bug the contract's "two decimals always" guarantee exists to avoid.

**Alternatives considered**: computing totals from the `partners[]` array to avoid trusting the aggregates — rejected; it inverts the source of truth and adds float error for no benefit.

---

## R3 — Collection percentage and the zero-revenue guard

**Decision**: `collectionRate = Number(received_amount) / Number(expected_revenue)`, rendered as an integer percent. When `expected_revenue` is `"0.00"`, render `—` instead of a percentage, and render the split bars as a flat neutral track.

**Rationale**: An empty period is a documented, non-error `200` response with all money at `"0.00"` (spec FR-016, FR-027). `0/0` is `NaN`, which would render as `NaN%`; special-casing to `0%` would be worse — it falsely implies "nothing collected" when the truth is "nothing was due". Float division is acceptable here because the result is only ever displayed rounded to a whole percent, never used for a monetary figure.

---

## R4 — Local-calendar date construction, never `toISOString()`

**Decision**: Build all `YYYY-MM-DD` values from `getFullYear()`, `getMonth()`, `getDate()`. Add `toISODateLocal(date: Date): string` to `lib/formatters.ts`. For display, parse back with the `` `${date}T12:00:00` `` midday trick already used across the codebase.

**Rationale**: `new Date().toISOString().split('T')[0]` — used in `LoanFormModal.tsx:16`, `JourneyTab.tsx:18`, and `NewAdvanceForm.tsx:11` — yields the **UTC** day. In Brazil (UTC-3) anything after 21:00 local reports tomorrow's date, so a "current month" preset generated late in the evening on the last day of the month would silently start the range in the wrong month. `Reports.tsx:42-47` already avoids this with a local `getLocalDateString` helper; this feature promotes that approach into `lib/formatters.ts` rather than inlining a seventh copy.

The `T12:00:00` suffix for display parsing (see `HR.tsx:180`, `EmployeePaycheckDetail.tsx:38`) avoids the mirror-image bug: `new Date('2026-08-01')` parses as UTC midnight and renders as July 31 in UTC-3.

**Alternatives considered**: adding a date library (date-fns, dayjs) — rejected, Constitution V forbids new dependencies without an explicit request, and two small helpers cover the need.

---

## R5 — Presets and their exact boundaries

**Decision**: Five presets plus free custom entry, all computed locally:

| Preset (pt-BR label) | Start | End |
|---|---|---|
| Mês atual *(default)* | 1st of current month | last day of current month |
| Mês anterior | 1st of previous month | last day of previous month |
| Trimestre atual | 1st day of current quarter | last day of current quarter |
| Ano atual | Jan 1 of current year | Dec 31 of current year |
| Próximos 30 dias | today | today + 29 days |

**Rationale**: Spec FR-007 names these five. Month-end is computed as `new Date(year, month + 1, 0).getDate()`, which handles 30/31-day months and leap Februaries without a lookup table. "Próximos 30 dias" is inclusive of today, hence +29 — it is forward-looking (what is about to come due), which is the collection-planning use case, while the other four are period-reporting.

---

## R6 — Auto-apply, with the invalid range blocking the request

**Decision**: No "Apply" button. Changing a preset or either date input updates the range; the hook fetches whenever the range is valid, and skips the fetch entirely while `end < start`, surfacing an inline message on the filter instead. Previously loaded figures stay on screen, visibly attributed to the still-applied range.

**Rationale**: `Reports.tsx:75` already auto-applies on range change, so this matches the codebase. But a range spans two inputs, and editing them in sequence necessarily passes through an invalid intermediate state — auto-firing there would hit the contract's `400 end_date earlier than start_date` on nearly every custom-range edit. Gating on validity satisfies spec FR-008 and SC-008 ("zero lookups attempted with end before start") without adding a click to the common preset path.

**Alternatives considered**:
- *Apply button* — rejected: adds an interaction to every range change and breaks SC-002's "at most two interactions" for common periods.
- *Auto-correcting the other date* — rejected: silently changing input the user didn't touch is hostile, and there is no correct guess about which end they meant.

---

## R7 — Stale-response guard

**Decision**: A monotonically incremented request id held in a `useRef`. Each fetch captures its id; on resolve, state is updated only if the captured id still matches the current one.

**Rationale**: Spec SC-004 requires that figures from two ranges are never shown together, and the "rapid range changes" edge case requires that a slower earlier response never overwrites a newer one. `fetch` has no cancellation without `AbortController`, and `src/lib/api.ts` does not thread a `signal` through — adding one would change a shared client for every domain, which Constitution V's minimal-scope rule discourages. The ref guard achieves the required behavior entirely inside the new hook.

**Alternatives considered**: `AbortController` plumbed through `api.get` — rejected as an out-of-scope change to shared infrastructure; worth doing globally someday, not as a side effect of this feature.

---

## R8 — Two loading flavors

**Decision**: `loading` (nothing on screen yet → skeleton) and `refreshing` (data on screen, new range in flight → keep the layout, dim it, show a spinner near the range label).

**Rationale**: Spec FR-026 requires the layout not to jump when data arrives, and FR-029 requires a visible signal during a range-change refresh rather than silent stale figures. Blanking the dashboard to a spinner on every range change would flash the whole page and lose scroll position in the breakdown; keeping the frame and dimming is the standard treatment.

---

## R9 — Charts without a charting library

**Decision**: The two proportion bars are Tailwind `div`s — a rounded track with percentage-width segments, a legend, and the same figures repeated as text.

**Rationale**: Constitution V bars new UI libraries without an explicit request, and the repo carries no charting dependency today. The visual need is two single-stacked bars (capital|profit and received|outstanding) — flex children with percentage widths and `title`/`aria-label` cover it in a few lines. Because the exact amounts also appear as text in the totals cards, the bars are decorative-comparative rather than the sole carrier of information, so nothing is lost for screen readers.

Spec scope helps here: FR-015 asks that the *relationship* be readable at a glance, not that a chart be drawn, and the spec explicitly excludes time-series/trend visuals.

---

## R10 — Resolving a breakdown row into a `Partner` for the drawer

**Decision**: `usePartnerLoanDrawer` loads the buggyman list once via the existing `partnerService.getByType(PartnerType.BUGGYMAN)` and matches the clicked row by `partner_id`. If the partner is not in that list, fall back to `partnerService.getById(partner_id)`, which returns a complete `Partner`. **Never construct a partial `Partner` by hand.**

**Rationale**: `LoanDrawer` takes a `Partner`, and `src/types/partner.ts` declares `loans`, `pix_key`, `type`, `active`, and `created_at` as **required** — a hand-built `{ id, name, active: true }` does not satisfy the interface, and forcing it through would need an `as` cast, which Constitution III forbids (`any` MUST NOT be used; typecheck failures are a merge blocker).

`getById` also returns the true `active`, which drives the Ativo/Inativo badge in the drawer header. That matters because the contract explicitly includes inactive partners in the summary — fabricating `active: true` would mislabel exactly the partners most worth inspecting. `partnerService.getById` already exists in `src/services/partnerService.ts`, so no new service method is needed.

The list match keeps the common path instant; the fetch is only for the rare miss. The dashboard itself never waits on the list — it is only needed at click time.

**Alternatives considered**:
- *Fabricating a minimal `Partner` from the row* — rejected: does not typecheck against the required fields, and mislabels inactive partners.
- *Making an unmatched row non-activatable* — rejected: FR-025 is unconditional, and a dead row is worse than a brief pending state.
- *Lifting the partner list into a shared context* — rejected as over-engineering for two consumers on the same page.

---

## Baseline notes recorded during research

- `src/test/setup.ts` **exists** (`import '@testing-library/jest-dom'`). The "Known issue" in `CLAUDE.md` describing it as missing is stale and should be removed — the suite runs.
- `npx vitest run` on this branch: **41 passing, 1 failing**. The failure is in `useEmployeePaychecks.test.ts` (an argument-matching assertion), pre-existing and unrelated to this feature. Do not treat it as a regression introduced here.
- `specs/api/loans.md` documents `/loans/period-summary` but the change is **uncommitted** on `feature/006-salary-bulk-summary`. The endpoint's presence on the running backend has not been verified — see quickstart step 1.
