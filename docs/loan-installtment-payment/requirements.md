# API Contract

The frontend must integrate with the Loan API using the following endpoints.



## List Installment Payments

Returns every payment registered for an installment.

### Request

```http
GET /loan-installments/{installmentId}/payments
```

### Response

Returns a list of `LoanInstallmentPayment`.

---

## Register Installment Payment

Registers a new payment for an installment.

### Request

```http
POST /loan-installments/{installmentId}/payments
```

Body

```json
{
    "amount": 300.00,
    "payment_date": "2026-07-15",
    "notes": "Advance payment"
}
```

### Response

Returns the created `LoanInstallmentPayment`.

---


## LoanInstallmentPayment

```ts
interface LoanInstallmentPayment {
    id: string;

    loan_installment_id: string;

    amount: number;

    payment_date: string;

    notes?: string;

    created_at: string;

    updated_at: string;
}
```

---

## InstallmentStatus

```ts
type InstallmentStatus =
    | "PENDING"
    | "PARTIALLY_PAID"
    | "PAID";
```

---

# Frontend Service Requirements

The application must provide a dedicated `loanService`.

The service should expose at least the following methods:

```ts
getInstallmentPayments(
    installmentId: string
): Promise<LoanInstallmentPayment[]>

createInstallmentPayment(
    installmentId: string,
    data: CreateInstallmentPaymentRequest
): Promise<LoanInstallmentPayment>
```

The service implementation must follow the same patterns used by the existing services in the project.

---

# Frontend Behavior

When a payment is successfully registered:

- Refresh the installment list.
- Refresh the loan details.
- Keep the Loan Drawer open.
- Expand the affected loan automatically.
- Visually update the installment status.
- Display the payment history for the installment without requiring a full page reload.

The user must be able to register multiple payments for the same installment until it reaches the `PAID` status.