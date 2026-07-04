# Implementation Plan - Remove End Date

## Objective
Remove `end_date` from the `CreateLoanRequest` interface, loan creation form, request payload, and unit test mocks, while preserving `end_date` in the `Loan` model as a readonly field.

## UI Architecture
- `src/components/LoanFormModal.tsx`:
  - Remove the "Data de Término" input field from the UI (the second column under starting date grid).
  - Remove `end_date` from the local `formData` state initialization.
  - Remove the validation logic for `end_date` (checking if empty, or if starting date is greater than end date).
  - Remove `end_date` from the constructed payload in `handleSubmit`.

## TypeScript Types
- `src/types/loan.ts`:
  - Keep `end_date: string` in `Loan` interface since it is returned from the API and shown on the UI.
  - Remove `end_date: string` from `CreateLoanRequest` interface.

## Tests Update
- `src/hooks/useLoans.test.ts`:
  - Remove `end_date` from the creation payload mock in `createLoan` test.

## Risks & Assumptions
- **Risk**: The UI layout might look uneven because we had a two-column grid with Start Date and End Date.
  - *Mitigation*: We will adjust the grid layout of "Data de Início" so that it spans either full width or is styled appropriately, or we can keep it inside a single column if appropriate.
