# Implementation Plan - Remove Due Day

## Objective
Remove the `due_day` field from TypeScript models, the loan form UI, the request payloads, and testing mocks.

## UI Architecture
- `src/components/LoanFormModal.tsx`:
  - Remove the "Dia de Vencimento Mensal" input field from the DOM.
  - Remove `due_day` from the local form state (`formData`).
  - Remove the validation logic for `due_day` (`errors.due_day` and bounds check).
  - Remove `due_day` from the `payload` constructed in `handleSubmit`.

## TypeScript Types
- `src/types/loan.ts`:
  - Remove `due_day: number` from `Loan` interface.
  - Remove `due_day: number` from `CreateLoanRequest` interface.

## Tests Update
- `src/hooks/useLoans.test.ts`:
  - Remove `due_day` from mock request objects.

## Risks & Assumptions
- **Risk**: Other components might rely on `due_day` if they display it.
  - *Mitigation*: We searched the codebase for `due_day`, `dueDay`, etc., and verified that no other components display or rely on it (only `LoanFormModal.tsx`, `useLoans.test.ts`, and `types/loan.ts`).
