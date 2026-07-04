# Feature Requirements - Remove End Date

## Objective
Remove the `end_date` field from the loan creation form (`LoanFormModal`) and the loan creation request payload (`CreateLoanRequest`). The `end_date` is a readonly field that will be calculated and returned by the backend.

---

## User Stories

### US-01 - Remove End Date from Creation Form
As a user,
I do not want to see or enter an "Data de Término" when creating a new loan,
So that the form matches the updated backend expectations where the end date is calculated automatically.

### Acceptance Criteria
- The "Data de Término" input field and its associated validation must be completely removed from `LoanFormModal`.
- The frontend must no longer include `end_date` in the `CreateLoanRequest` interface.
- `Loan` interface must still contain `end_date` because it is returned as a readonly property by the backend and displayed on UI elements (e.g., `LoanCard`).
- Any mock/unit tests using `end_date` in loan creation payload must be updated to omit this field.
