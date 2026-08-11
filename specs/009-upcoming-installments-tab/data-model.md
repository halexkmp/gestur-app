# Phase 1 Data Model: Upcoming Installments Tab

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

All new types go in `src/types/loan.ts`, which is already re-exported through `src/types/index.ts` via `export * from './loan'` (Principle III). Nothing is added to `types/index.ts` itself.

---

## Entities

### `UpcomingInstallment`

One unsettled installment of one partner's loan — the spec's **Owed installment (row)**. Maps 1:1 to an element of the `GET /loans/upcoming-installments` array; field names mirror the wire format exactly, as the other loan types do.

| Field | Type | Notes |
|---|---|---|
| `installment_id` | `string` | UUID. React key. Unique within a response — the contract guarantees each installment appears at most once. |
| `loan_id` | `string` | UUID. Which loan the installment belongs to; part of the server's sort key. |
| `partner_id` | `string` | UUID. The only field the drill-through needs (R-007). |
| `partner_name` | `string` | Denormalized — no partner lookup is required to render a row. |
| `installment_number` | `number` | Position within its loan, 1-based. Displayed as e.g. "3ª". |
| `due_date` | `string` | `YYYY-MM-DD`. Primary sort key, ascending. |
| `amount` | `string` | Money. Scheduled for this installment. |
| `paid_amount` | `string` | Money. Already received against it; capped at `amount`. |
| `remaining_amount` | `string` | Money. `amount - paid_amount`. The field that feeds the outstanding total. |
| `status` | `UpcomingInstallmentStatus` | Never `PAID` — see below. |
| `is_overdue` | `boolean` | Server-computed against the server's date. Trusted verbatim (FR-011). |

**Money fields** (`amount`, `paid_amount`, `remaining_amount`) are decimal **strings** with exactly two decimals — `"0.00"`, never `"0"` — consistent with the `Money` type in `specs/api/shared.md` and with `LoanPeriodSummary`. They are typed `string`, not `number`. Render with `formatCurrency`; sum per R-002.

### `UpcomingInstallmentStatus`

```ts
export type UpcomingInstallmentStatus = Exclude<InstallmentStatus, 'PAID'>;
```

Derived from the existing `InstallmentStatus` (`'PENDING' | 'PARTIALLY_PAID' | 'PAID'`) rather than redeclared, so the two cannot drift. The contract guarantees `status` is never `PAID` on this endpoint — this list is what is still owed, not payment history — so the exclusion encodes a real backend guarantee in the type system instead of a comment (Principle III).

The practical effect: a `switch` over this type needs two branches, and any attempt to render a "paid" row state fails to typecheck.

### `UpcomingInstallmentsParams`

Request parameters for the service method.

| Field | Type | Notes |
|---|---|---|
| `start_date` | `string` | Required. `YYYY-MM-DD`. |
| `end_date` | `string` | Required. `YYYY-MM-DD`, must be `>= start_date`. |
| `include_overdue` | `boolean` (optional) | Sent explicitly in both states (R-001). |
| `partner_id` | `string` (optional) | **Not used by this feature** — FR-017 fixes the filter set at two. Typed because the endpoint supports it and a future per-partner view is the obvious next consumer. |
| `limit` | `number` (optional) | **Not used by this feature** — see R-008. Typed for the same reason. |

Modeled on the existing `LoanPeriodSummaryParams`. The two unused optional fields are deliberate and documented rather than omitted; they cost nothing and record the full endpoint surface in one place.

---

## Derived values

Computed in `useUpcomingInstallments`, never in a component (Principle I). None of these come from the API.

| Value | Type | Derivation | Serves |
|---|---|---|---|
| `rowCount` | `number` | `installments.length` | FR-012 |
| `totalOutstanding` | `number` | Sum of `remaining_amount` in integer cents, divided by 100 (R-002) | FR-012 |
| `overdueCount` | `number` | Count of rows with `is_overdue === true` | FR-010, US2 legibility |
| `invalidRange` | `boolean` | `endDate < startDate` — plain string comparison is correct on zero-padded `YYYY-MM-DD` | FR-019 |
| `isEmpty` | `boolean` | Loaded successfully and `installments.length === 0`. Distinct from "not yet loaded" (`installments === null`) | FR-023 |

`isEmpty` must be derived from a loaded-and-empty state, not from `length === 0` alone, or the empty state will flash during the first load — the same distinction `SummaryTab` draws with `!!summary && summary.installments_count === 0`.

---

## State transitions

The tab is read-only; no entity changes state through this feature. Two transitions are nonetheless observable, both driven from the reused `LoanDrawer` (FR-026):

| Trigger | Effect on the list after refresh |
|---|---|
| A payment fully settles an installment | Its `status` becomes `PAID` server-side → the row **disappears** (FR-014) |
| A partial payment is registered | Row remains; `paid_amount` rises, `remaining_amount` falls, `status` becomes `PARTIALLY_PAID` |

Neither is applied optimistically. The list reflects them only on the next fetch.

---

## Relationships

```text
Partner ──1:N──> Loan ──1:N──> Installment
                                    │
                                    └── UpcomingInstallment = the unsettled subset,
                                        flattened with partner_id + partner_name
                                        denormalized onto each row
```

One partner with several loans yields several independent rows; rows are never collapsed per partner (FR-015) — that aggregation is what the Resumo tab does, over the same underlying installments.

---

## Validation rules

Enforced client-side, before any request:

- **Range required**: both dates always present; the filter component keeps them populated from a preset or manual entry.
- **Range ordering**: `endDate >= startDate`. When violated, the hook returns early without fetching and `invalidRange` drives the inline warning already built into `PeriodRangeFilter` (FR-019). This mirrors `useLoanPeriodSummary`'s guard and avoids a guaranteed `400`.

Trusted from the server and **not** re-validated or recomputed client-side:

- `paid_amount + remaining_amount === amount` (displayed, per SC-005 — verifiable by eye, not asserted in code)
- `remaining_amount >= 0` and no negative amounts; overpayments are capped server-side
- ordering by `due_date` asc, then `loan_id`, then `installment_number` — the list is rendered in received order (FR-007)
- `is_overdue` (FR-011)
- exclusion of `PAID` installments, `CANCELED` loans; inclusion of inactive partners

---

## Empty and boundary cases

| Case | Data shape | Handling |
|---|---|---|
| Nothing owed in range | `[]` — a `200`, not an error | Empty state, distinct from loading and error (FR-023) |
| Overdue switch on, long history | Potentially hundreds of rows, no lower date bound | Rendered in full; `rowCount` makes the size legible (FR-012, R-008) |
| Range starts in the past | In-range rows may carry `is_overdue: true` | Marked overdue — the flag is authoritative (FR-011) |
| Installment due today | `is_overdue: false` | Not marked; `daysOverdue` returns 0 |
| Fully paid installment | Absent from the response entirely | Nothing to handle — it cannot appear |
| Partner with several loans | Several rows sharing `partner_id` | Each row independent; `installment_id` is the key, never `partner_id` |
| Inactive partner | Ordinary row, no distinguishing field | Rendered normally — an inactive partner can still owe money |
