# Contract: Loan Period Summary

Status: **DOCUMENTED, NOT YET VERIFIED AGAINST A LIVE BACKEND.**

Unlike `007-advance-history-modal`, which consumed an already-shipped endpoint, this feature depends on `GET /loans/period-summary` — documented in `specs/api/loans.md`, but that documentation is **uncommitted** on `feature/006-salary-bulk-summary` at the time of planning, and no live call has been made against it. Verification is quickstart step 1 and is a prerequisite for implementation.

This file records how the feature consumes the endpoint. `specs/api/loans.md` remains the source of truth; if the live backend disagrees with it, fix `specs/api/loans.md` by hand and update this file to match.

---

## Endpoint

```text
GET /loans/period-summary?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
```

Both parameters are **required**. No role requirement — any valid token is accepted (`specs/api/shared.md` marks only journey moderation and `/employees/*` as role-gated). The `isSuperAdmin` restriction on this feature is therefore a **frontend product decision**, confirmed with the user during planning, not a backend guarantee. Do not describe it in the UI as a server-enforced permission.

One call serves the entire dashboard. There is no per-partner follow-up request.

---

## Response (200)

```text
start_date
end_date
expected_revenue        # total scheduled to be received in the range
expected_capital        # principal portion of expected_revenue
expected_profit         # interest portion of expected_revenue
received_amount         # already paid against those installments
outstanding_amount      # still to collect
installments_count
partners_count
partners: [
  {
    partner_id
    partner_name
    scheduled_amount
    received_amount
    outstanding_amount
    installments_count
  }
]
```

Maps 1:1 to `LoanPeriodSummary` / `LoanPeriodSummaryPartner` in [data-model.md](../data-model.md). Every money field is a **string with exactly two decimals**, including zeros (`"0.00"`, never `"0"`).

---

## Selection semantics — these drive the UI copy

The labels on this dashboard have to match how the backend actually selects data, or the numbers will be quietly misread:

- Installments are selected by **due date** falling inside the inclusive range — **not** by payment date. So `received_amount` means "paid against installments due in this period", which may include payments made before or after the period. UI copy must say *vencimento* (due), never *recebido no período*.
- `CANCELED` loans are excluded entirely.
- Fully `PAID` loans are **included**, landing in `received_amount`. A settled partner still appears in the breakdown (spec FR-023) rather than vanishing.
- **Inactive partners are included.** Deactivating a buggyman does not remove their debt from these figures, and their row must remain clickable through to the drawer (spec User Story 3 scenario 3).
- A partner with several loans appears **once**, amounts combined.
- `partners` arrives ordered by `scheduled_amount` descending, then `partner_name` ascending — this is the dashboard's default order, so no client sort is needed for the initial render (spec FR-020, SC-005).

---

## Guarantees relied upon

The UI displays these fields and does not recompute them (research.md R2):

- `expected_capital + expected_profit == expected_revenue`
- `received_amount + outstanding_amount == expected_revenue`
- `Σ partners[].scheduled_amount == expected_revenue`
- `Σ partners[].received_amount == received_amount`
- per entry: `received_amount + outstanding_amount == scheduled_amount`
- no amount is negative — overpayments are capped server-side
- every money field carries two decimals

**Explicitly not guaranteed**: that a sum of period summaries reconciles to a loan's own `total_amount`. Installment amounts are rounded to 2dp at loan creation, so a loan whose total doesn't divide evenly by its installment count can differ by a few cents. Installments are authoritative for what is owed on a date. No UI element may present cross-view equality as a promise.

---

## Empty range is a success, not an error

`200` with all money at `"0.00"`, `installments_count: 0`, `partners_count: 0`, `partners: []`.

This must render as the dedicated empty state (spec FR-027) — visually distinct from both loading and error. It is the single easiest thing to get wrong in this feature.

---

## Errors

| Status | Cause | Frontend handling |
|---|---|---|
| `400` | `end_date` earlier than `start_date` | **Never reached.** The hook refuses to fetch an invalid range and shows an inline message on the filter instead (spec FR-008, SC-008). |
| `422` | Either date missing or malformed | Not reachable through the UI — both dates are always populated and always produced by the local date helpers. Falls through to the generic error state if it ever occurs. |
| `401` | Missing/expired token | Handled globally by `src/lib/api.ts`, which clears `auth_token` and redirects to `/login`. No feature-specific handling. |
| other | Network/server failure | Generic error state with a retry action that refetches without a page reload (spec FR-028). |

`src/lib/api.ts` raises non-401 failures as `ApiError` carrying `status` and the backend's `detail`. The hook stores `err instanceof Error ? err.message : <fallback>`, matching `useLoans.ts`.

---

## Service signature

Added to the existing `loanService` in `src/services/loanService.ts` — no new service file, per the domain-slice pattern:

```ts
getPeriodSummary: (params: LoanPeriodSummaryParams): Promise<LoanPeriodSummary> =>
  api.get<LoanPeriodSummary>('/loans/period-summary', { params }),
```

`api.get` already serializes `params` into the query string and drops `undefined`/`null`/empty values (`src/lib/api.ts`). Since both dates are always populated, nothing is dropped.

---

## Verification checklist (perform before implementing)

Against the running backend, with a valid token:

1. `GET /loans/period-summary?start_date=<1st of a month with known installments>&end_date=<last of that month>` → `200`, non-zero figures.
2. Confirm every money field is a **string** with two decimals — including any that are zero.
3. Confirm the two reconciliation identities hold on the returned payload.
4. `GET` a far-future range with no installments → `200`, all `"0.00"`, `partners: []`. **Not** a `404` or an error.
5. `GET` with `end_date` before `start_date` → `400`. Confirms the guard the UI implements is guarding something real.
6. Confirm a known **inactive** partner with installments due in the range appears in `partners[]`.
7. Confirm a partner with two loans due in the range appears **once**, with amounts combined.

Record the results in this file. If any step disagrees with `specs/api/loans.md`, correct that file by hand — it is the source of truth and is expected to describe real behavior, including quirks.
