# Feature Requirements - Remove Due Day

## Objective
Remove the `due_day` field from the frontend codebase completely because it has been deprecated and removed from the backend database. This includes updating requests, typescript models, forms, and tests.

---

## User Stories

### US-01 - Remove Due Day from Creation Form
As a user,
I do not want to see or enter a "Dia de Vencimento Mensal" when creating a new loan,
So that the form matches the updated backend expectations and remains simple and correct.

### Acceptance Criteria
- The "Dia de Vencimento Mensal" input field must be completely removed from `LoanFormModal`.
- The frontend must no longer send `due_day` in the loan creation request payload.
- TypeScript interfaces `Loan` and `CreateLoanRequest` must not contain the `due_day` property.
- Any mock/unit tests using `due_day` must be updated to omit this field.
