# Tasks - Buggyman Loan Management

## Phase 1: Types
- [x] T1.1: Create `src/types/loan.ts` defining `Loan`, `LoanInstallment`, `LoanStatus`, and `CreateLoanRequest` interfaces (Plan: P1.1, Req: Data Models)
- [x] T1.2: Export all loan types in the `src/types/index.ts` barrel file (Plan: P1.1)

## Phase 2: Services
- [x] T2.1: Implement `src/services/loanService.ts` with API endpoints matching the technical contract (Plan: P2.1, Req: API Contract)
- [x] T2.2: Implement proper error formatting and API communication handling in `loanService` (Plan: P2.2, Req: FR-06)

## Phase 3: Hooks
- [x] T3.1: Create custom React hook `src/hooks/useLoans.ts` to manage loading, error, and list data (Plan: P3.1, Req: FR-05)
- [x] T3.2: Implement `createLoan` and `payInstallment` actions with automatic list and detail refetch logic inside the hook (Plan: P3.2, Req: FR-07)

## Phase 4: Components
- [x] T4.1: Implement custom right-side Drawer layout in `src/components/LoanDrawer.tsx` with Backdrop, Header, and Close handlers (Plan: P4.1, Req: UX Requirements)
- [x] T4.2: Implement collapsible loan info list in `src/components/LoanCard.tsx` (Plan: P4.2, Req: Collapsed/Expanded states)
- [x] T4.3: Implement the installment list timeline in `src/components/InstallmentList.tsx` showing installment info and payment actions (Plan: P4.3, Req: Chronological Installments)
- [x] T4.4: Implement client-validated loan creation form in `src/components/LoanFormModal.tsx` following existing application modals (Plan: P4.4, Req: Validation Rules)

## Phase 5: Integration
- [x] T5.1: Add "Loans" action button using Lucide `Coins`/`DollarSign` icon on Buggyman cards in `src/components/Buggyman.tsx` (Plan: P5.1, Req: UX Requirements)
- [x] T5.2: Integrate the `LoanDrawer` inside the main `Buggyman` page layout and wire the active partner state (Plan: P5.2, Req: FR-02)

## Phase 6: Verification (Tests)
- [x] T6.1: Add unit tests for `loanService` verifying happy and error response paths (Plan: P6.1, Req: FR-06)
- [x] T6.2: Add unit tests for `useLoans` hook ensuring data orchestration and side-effects work as expected (Plan: P6.2, Req: Non-Functional)
- [x] T6.3: Add component tests for `LoanDrawer`, `LoanFormModal`, and `InstallmentList` asserting UX behavior, form validations, and user feedback (Plan: P6.3, Req: Non-Functional)


# Testing

### Validation Approach
Verification consists of automated unit and component testing under the existing `vitest` setup. No production environment or manual browser clicks are strictly required, ensuring high-accuracy assertions inside the CI.

### Key Scenarios
- **Service Verification**:
    - Assert HTTP verbs, path variables, query strings, and payloads match the API contract precisely.
    - Validate response type bindings on success.
- **Hook Verification**:
    - Confirm hook triggers fetching on selection changes.
    - Assert loading status cycles accurately.
    - Ensure local array state is refreshed on payment/creation success.
- **Component Verification**:
    - Form validation errors appear correctly when submitting negative amounts.
    - Clicking "Mark as Paid" triggers correct confirmation workflow.