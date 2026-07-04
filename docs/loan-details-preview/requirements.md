# Feature Requirements - Loan Details Preview

## Objective
Add two preview labels inside the loan creation form (`LoanFormModal`) that show the estimated end date and the total amount before saving. The labels must update dynamically whenever the input values change.

---

## User Stories

### US-01 - Dynamic Loan Details Preview
As a user,
I want to see the estimated end date and total amount of a loan before saving it,
So that I can verify the loan details are correct and inform the partner.

### Acceptance Criteria
- Two new preview labels must be added inside the `LoanFormModal` component, below the input fields and above the submit buttons.
- The **End Date** (Data de Término) must be calculated as: `start_date` + `installments_qty` (weeks) * 7 days.
- The **Total Amount** (Valor Total) must be calculated based on the `principal_amount`, `interest_rate`, and `installments_qty` (number of payments).
  - Formula: `principal_amount * (1 + (interest_rate / 100) * installments_qty)` (Simple weekly interest).
- The labels must update in real-time as the user types/updates the form inputs (principal amount, interest rate, number of installments, or start date).
- If the inputs are invalid or incomplete, the preview values should degrade gracefully (e.g., displaying `-`).
