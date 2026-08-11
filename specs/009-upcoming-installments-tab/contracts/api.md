# Backend Contract (as consumed by this feature)

**Source of truth**: [`specs/api/loans.md`](../../api/loans.md) § *Upcoming Installments*. This file records only how *this* feature consumes it, and which guarantees it leans on. If the two ever disagree, `specs/api/loans.md` wins — update it by hand, then update this file.

**No backend work is required.** The endpoint is documented and live.

---

## `GET /loans/upcoming-installments`

Row-level view of what the loan book still has to collect, across all partners.

### Request

Sent through `api.get` (Bearer token attached automatically by `src/lib/api.ts`).

| Param | Sent by this feature | Value |
|---|---|---|
| `start_date` | always | Range start, `YYYY-MM-DD`, from `PeriodRangeFilter` |
| `end_date` | always | Range end, `YYYY-MM-DD`, `>= start_date` |
| `include_overdue` | always | `true` / `false` from the overdue switch (R-001) |
| `partner_id` | never | Filter set is fixed at two (FR-017) |
| `limit` | never | No user-facing row cap (R-008) |

Example: `/loans/upcoming-installments?start_date=2026-08-10&end_date=2026-09-08&include_overdue=false`

### Response — `200`

A **flat JSON array, no envelope**. This differs from `/loans/period-summary`, which returns an object. Empty result is `[]`.

```jsonc
[
  {
    "installment_id": "9f1c…",
    "loan_id": "3ab7…",
    "partner_id": "c410…",
    "partner_name": "João da Silva",
    "installment_number": 3,
    "due_date": "2026-08-14",
    "amount": "250.00",
    "paid_amount": "100.00",
    "remaining_amount": "150.00",
    "status": "PARTIALLY_PAID",
    "is_overdue": false
  }
]
```

Typed as `UpcomingInstallment[]` — see [data-model.md](../data-model.md).

### Guarantees this feature relies on

| Guarantee | Relied on by |
|---|---|
| `status` is never `PAID`; settled installments are excluded | FR-014, the `Exclude<…, 'PAID'>` type |
| `paid_amount + remaining_amount === amount`, per row | SC-005 |
| No negative amounts; overpayments capped server-side | FR-008 display |
| Every money field is a string with exactly two decimals (`"0.00"`) | `formatCurrency`, cents-based summing (R-002) |
| Ordered `due_date` asc, then `loan_id`, then `installment_number` | FR-007 — rendered in received order, no client sort |
| Each installment appears at most once | `installment_id` as React key |
| `partner_name` is denormalized onto every row | No partner lookup to render the table |
| With `include_overdue=false`: every row falls inside the range | FR-020 |
| With `include_overdue=true`: every pre-range row has `is_overdue: true` | FR-021 |
| `is_overdue` is server-computed against the server's date | FR-011 |
| Cancelled loans excluded; inactive partners included | Edge cases |

### Errors

| Status | When | Handling here |
|---|---|---|
| `400` | `end_date < start_date` | **Prevented** — the hook returns early on an inverted range (FR-019), so this should never be issued |
| `401` | No/expired token | Handled globally by `api.ts`: clears the token, redirects to `/login`. The tab needs no handling |
| `422` | Missing/malformed dates, `limit < 1`, bad `partner_id` UUID | Not reachable — dates come from a date input or a preset; `limit`/`partner_id` are never sent |
| network / `5xx` | — | Surfaced as the tab's error state with a retry (FR-024) |

`ApiError.message` comes from the response's `detail` field via `api.ts`, and is what the hook stores in `error` — the same path `useLoanPeriodSummary` uses.

Note: authentication resolves *before* parameter validation, so a request with no token and a bad param returns `401`, not `422`. Not reachable here, but it is why `401` handling cannot be inferred from param correctness.

### Non-guarantee: reconciliation with `/loans/period-summary`

For the same window with `include_overdue=false`, `sum(remaining_amount)` **usually** equals the period summary's `outstanding_amount` — but not always. Installments settled via `PATCH /loan-installments/{id}/pay` (which `loanService.payInstallment` uses) get status `PAID` without a payment row: this endpoint drops them, the summary still counts them as outstanding.

The UI must not present the two as reconciling (FR-013, R-005).

---

## Reused endpoints (no change)

| Endpoint | Via | Purpose |
|---|---|---|
| `GET /partners/by-type?type=BUGGYMAN` | `usePartnerLoanDrawer` | Preloads partners to resolve a row's `partner_id` for the drawer |
| `GET /partners/{id}` | `usePartnerLoanDrawer` | Fallback when a partner is missing from the preloaded list |
| `GET /loans/?partner_id=…`, `GET /loans/{id}` | `LoanDrawer` → `useLoans` | Loan detail opened from a row (FR-025) |

All are already wired; this feature adds no call sites beyond reusing the existing hooks.
