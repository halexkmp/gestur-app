# Feature Requirements

# Feature

Edit Loan Status

---

# Objective

Allow users to edit the status of loans associated with Buggymans from the Buggyman page / Loan management interface.

The feature must allow users to:

- Select a new status for an existing loan.
- Supported statuses:
  - `ACTIVE` (Ativo)
  - `PAID` (Pago)
  - `CANCELED` (Cancelado)
- Update the status via the backend API using the `PUT /loans/{loan_id}` endpoint.
- Display the updated status in the loan interface.

The feature must integrate with the existing backend API.

---

# User Stories

## US-01 - Edit Loan Status

As a user,

I want to edit the status of an existing loan,

So that I can keep track of its actual state.

### Acceptance Criteria

- The expanded `LoanCard` must provide an option/dropdown to edit the loan status.
- The status select dropdown should display:
  - `ACTIVE` as "Ativo"
  - `PAID` as "Pago"
  - `CANCELED` as "Cancelado"
- Changing the selection triggers an API call to update the status of the loan on the backend.
- While updating, a loading state/indicator should be displayed.
- After a successful update, the loan's status in the list should be updated and reflect the new state.
- In case of an API error, an error message should be displayed.
