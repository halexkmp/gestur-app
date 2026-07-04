# Tasks - Edit Loan Status

## Phase 1: Types
- [x] T1.1: Update `LoanStatus` in `src/types/loan.ts` to include `'PAID'` and `'CANCELED'` (Plan: P1.1, Req: Data Models)

## Phase 2: Services
- [x] T2.1: Add `update` method to `src/services/loanService.ts` mapping to `PUT /loans/{loanId}` (Plan: P2.1, Req: API Contract)

## Phase 3: Hooks
- [x] T3.1: Expose `updateLoanStatus` function inside `src/hooks/useLoans.ts` (Plan: P3.1, Req: FR-05)
- [x] T3.2: Update the `loans` state locally upon successful update in `useLoans.ts` (Plan: P3.2)

## Phase 4: Components
- [x] T4.1: Update `src/components/LoanCard.tsx` to display a status dropdown option in the expanded state (Plan: P4.1, Req: US-01)
- [x] T4.2: Update `src/components/LoanDrawer.tsx` to handle status updates (Plan: P4.2)

## Phase 5: Integration & Verification
- [x] T5.1: Add or update unit tests for `loanService` and `useLoans` (Plan: P6.1)
- [x] T5.2: Verify that everything compiles and works correctly (Plan: P6.2)
