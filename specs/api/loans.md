# Loans API

## Endpoints

POST /loans/ → 201

GET /loans/?partner_id={uuid}   # partner_id is REQUIRED
                                # typed as a plain string, not validated as a UUID:
                                # a non-UUID value returns [] rather than 422

GET /loans/period-summary?start_date={date}&end_date={date}   # both REQUIRED

GET /loans/{loan_id}

GET /loans/{loan_id}/summary

PUT /loans/{loan_id}

GET /loans/{loan_id}/installments

PATCH /loan-installments/{installment_id}/pay

GET /loan-installments/{installment_id}/payments

POST /loan-installments/{installment_id}/payments → 201

---

# Loan

Response for POST /loans/, GET /loans/, PUT /loans/{id}:

```text
id
partner_id
principal_amount
interest_rate
total_amount
installments_qty
start_date
end_date
status
created_at
updated_at
```

Response for GET /loans/{loan_id} is a **different shape** — no `partner_id`,
`created_at`, `updated_at`; adds a nested `installments[]`:

```text
id
principal_amount
interest_rate
total_amount
installments_qty
start_date
end_date
status
installments: Installment[]
```

Create request (POST /loans/):

```text
partner_id
principal_amount   # > 0
interest_rate       # >= 0
installments_qty     # > 0
start_date
```

`end_date`, `status`, `total_amount` are server-computed and not accepted in the request.

Update request (PUT /loans/{loan_id}, all optional):

```text
principal_amount
interest_rate
installments_qty
start_date
end_date
status
```

---

# Installment

```text
id
installment_number
amount
due_date
payment_date
status
created_at
updated_at
```

Pay request (PATCH /loan-installments/{installment_id}/pay):

```text
payment_date   # optional
```

The whole request body is optional — the endpoint accepts no body at all, which is
equivalent to sending `payment_date: null`. Responds with the updated Installment
(same shape as above).

---

# Loan Summary

GET /loans/{loan_id}/summary response:

```text
id
partner_id
partner_name
principal_amount
interest_rate
total_amount
installments_qty
due_weekday
start_date
end_date
status
created_at
total_paid
remaining_balance
total_payments
paid_installments
partially_paid_installments
pending_installments
installments: [
  {
    ...Installment fields,
    payments: Payment[]
  }
]
```

---

# Loan Period Summary

`GET /loans/period-summary` — aggregate view of what the loan book is scheduled to
collect over a date range. Built for the dashboard; covers all partners at once.

Query parameters (both **required**):

```text
start_date   # YYYY-MM-DD, inclusive lower bound on installment due date
end_date     # YYYY-MM-DD, inclusive upper bound; must be >= start_date
```

Response:

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

Selection rule: installments whose **due date** falls inside the range, regardless of
when (or whether) they were paid. Installments on `CANCELED` loans are excluded
entirely; installments on fully `PAID` loans are included and land in `received_amount`.
Inactive partners are included. A payment dated outside the range still counts as
received when its installment is due inside the range.

`partners` is ordered by `scheduled_amount` descending, then `partner_name` ascending.
A partner with several loans appears once, with amounts combined.

Guarantees:

- `expected_capital + expected_profit == expected_revenue`
- `received_amount + outstanding_amount == expected_revenue`
- `sum(partners[].scheduled_amount) == expected_revenue`
- `sum(partners[].received_amount) == received_amount`
- per entry: `received_amount + outstanding_amount == scheduled_amount`
- no amount is negative (payments beyond an installment's amount are capped)
- every money field carries two decimals, including zeros (`"0.00"`, never `"0"`)

An empty range is **not** an error: `200` with all money fields `"0.00"`, both counts
`0`, and `partners: []`.

Errors: `400` when `end_date` is earlier than `start_date`; `422` when either date is
missing or malformed; `401` without a valid token.

> **Reconciliation note**: per-period figures sum the persisted installment amounts,
> each rounded to 2dp at loan creation. On a loan whose total does not divide evenly by
> its installment count, the sum of its installments can differ from the loan's own
> `total_amount` by a few cents. The installments are authoritative for what a partner
> owes on a date — do not expect a full-loan `total_amount` to reconcile exactly against
> a sum of period summaries.

---

# Payment

Register request (POST /loan-installments/{installment_id}/payments):

```text
amount     # > 0
payment_date
notes      # nullable
```

Response (POST and GET /loan-installments/{installment_id}/payments):

```text
id
amount
payment_date
notes
created_at
updated_at
```