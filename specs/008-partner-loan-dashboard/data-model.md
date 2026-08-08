# Phase 1 Data Model: Partner Loan Period Dashboard

All types are additive. They belong in `src/types/loan.ts`, which is already re-exported by `src/types/index.ts` via `export * from './loan'` — no change to the barrel is needed.

---

## Transport models

### `LoanPeriodSummary`

The whole response of `GET /loans/period-summary`. One instance per applied date range.

```ts
export interface LoanPeriodSummary {
  start_date: string;            // YYYY-MM-DD, echoed back by the server
  end_date: string;              // YYYY-MM-DD
  expected_revenue: string;      // Money — total scheduled to be received in the range
  expected_capital: string;      // Money — principal portion of expected_revenue
  expected_profit: string;       // Money — interest portion of expected_revenue
  received_amount: string;       // Money — already paid against those installments
  outstanding_amount: string;    // Money — still to collect
  installments_count: number;
  partners_count: number;
  partners: LoanPeriodSummaryPartner[];
}
```

### `LoanPeriodSummaryPartner`

One buggyman's share of the period. Combined across all of that partner's loans.

```ts
export interface LoanPeriodSummaryPartner {
  partner_id: string;            // UUID
  partner_name: string;
  scheduled_amount: string;      // Money
  received_amount: string;       // Money
  outstanding_amount: string;    // Money
  installments_count: number;
}
```

### `LoanPeriodSummaryParams`

The service call's input.

```ts
export interface LoanPeriodSummaryParams {
  start_date: string;            // YYYY-MM-DD, inclusive
  end_date: string;              // YYYY-MM-DD, inclusive, >= start_date
}
```

**Money is `string`, deliberately.** `specs/api/shared.md` defines Money as a decimal represented as a string, and the endpoint guarantees two decimals on every money field including zeros (`"0.00"`). This matches the existing `LoanSummary` type in `types/loan.ts`, which also models money as `string`. See research.md R1 — the naive `value.toLocaleString('pt-BR', {...})` pattern used elsewhere in the codebase silently no-ops on strings and must not be copied.

---

## Invariants (guaranteed by the backend, asserted by validation, never recomputed)

Per research.md R2, the UI displays these fields rather than deriving them. They are listed so validation and tests can assert them.

- `expected_capital + expected_profit == expected_revenue`
- `received_amount + outstanding_amount == expected_revenue`
- `Σ partners[].scheduled_amount == expected_revenue`
- `Σ partners[].received_amount == received_amount`
- per partner: `received_amount + outstanding_amount == scheduled_amount`
- no field is negative (overpayment is capped server-side)
- `partners.length == partners_count`
- `partners` arrives ordered by `scheduled_amount` desc, then `partner_name` asc

**Not guaranteed**: that summing period summaries reconciles to a loan's own `total_amount`. Installment amounts are each rounded to 2dp at loan creation, so a loan whose total doesn't divide evenly can differ by a few cents. No UI may assert cross-view equality.

---

## Client-side view models

Not persisted, not sent anywhere — derived in the hook or in components for rendering.

### `PeriodRange`

Owned by `useLoanPeriodSummary`; the applied filter state.

```ts
interface PeriodRange {
  startDate: string;             // YYYY-MM-DD, local calendar (research.md R4)
  endDate: string;               // YYYY-MM-DD
}
```

**Validation**: `endDate >= startDate`. Plain lexicographic string comparison is correct for zero-padded `YYYY-MM-DD` — no `Date` parsing needed. While invalid, the hook does not fetch and `invalidRange` is `true`; the previously loaded summary stays on screen, still labelled with the range it belongs to.

**Default**: current calendar month, first day through last day, built from local date parts.

### `PeriodPreset`

Lives in `src/types/loan.ts` alongside the transport models, not in `lib/formatters.ts` — Constitution III routes models to `types/<domain>.ts` and reserves `lib/` for utilities. `periodPresetRange()` in `formatters.ts` imports it from there.

```ts
export type PeriodPresetId =
  | 'current-month'      // default
  | 'previous-month'
  | 'current-quarter'
  | 'current-year'
  | 'next-30-days'
  | 'custom';
```

Boundaries defined in research.md R5. `custom` is not selectable directly — it is what the filter displays once either date input is edited away from a preset's boundaries.

### Derived display values

| Value | Derivation | Zero/edge guard |
|---|---|---|
| `collectionRate` | `Number(received_amount) / Number(expected_revenue)`, shown as whole percent | `expected_revenue === "0.00"` → render `—`, never `0%` or `NaN%` |
| `capitalShare` / `profitShare` | each over `expected_revenue`, as bar segment widths | zero revenue → flat neutral track, no segments |
| `receivedShare` / `outstandingShare` | each over `expected_revenue`, as bar segment widths | same |
| per-row `progress` | `Number(row.received_amount) / Number(row.scheduled_amount)` | `scheduled_amount === "0.00"` → empty track |
| per-row `settled` | `row.outstanding_amount === "0.00"` | drives the "quitado" visual state (spec FR-023) |

Float division is acceptable for all of these because every result is only ever used as a rounded percentage or a CSS width — never as a money figure.

---

## UI state (component-local, not in the hook)

| State | Owner | Purpose |
|---|---|---|
| `activeTab: 'partners' \| 'summary'` | `Buggyman.tsx` | Tab shell; persists while on the page (spec FR-004) |
| `sortKey` / `sortDirection` | `PartnerBreakdownTable` | Re-order by scheduled, outstanding, or name (FR-021); defaults to the server's order |
| `nameFilter: string` | `PartnerBreakdownTable` | Narrows rows only — never re-scopes the headline totals (FR-022) |
| `drawerPartner: Partner \| null` | `usePartnerLoanDrawer` | Drill-through target for the existing `LoanDrawer`; always a complete `Partner` from the buggyman list or `partnerService.getById` — never hand-built |

---

## Relationships

```text
PeriodRange ──(start_date, end_date)──▶ loanService.getPeriodSummary
                                              │
                                              ▼
                                     LoanPeriodSummary
                                              │
                                     partners[] │ 1..n
                                              ▼
                                 LoanPeriodSummaryPartner
                                              │
                              partner_id ──── matched against ────▶ Partner (existing)
                                                                        │
                                                                        ▼
                                                              LoanDrawer (existing)
```

`Partner` resolution for the drawer is described in research.md R10: match `partner_id` against the buggyman list `usePartnerLoanDrawer` loads, falling back to `partnerService.getById(partner_id)` when absent. A partial `Partner` is never constructed — every field on the interface is required.

No entity here is created, updated, or deleted by this feature — the dashboard is read-only.
