# Loans API

## Endpoints

POST /loans/ → 201

GET /loans/?partner_id={uuid}   # partner_id is REQUIRED

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