# Tasks - Loan Installment Payments

## Phase 1: Types and Services
- [x] T1.1: Add `LoanInstallmentPayment` interface and `InstallmentStatus` type to `src/types/loan.ts` (Plan: Section 1, Req: InstallmentStatus & LoanInstallmentPayment)
- [x] T1.2: Add `status` field to `LoanInstallment` interface in `src/types/loan.ts`
- [x] T1.3: Expose types through `src/types/index.ts` barrel
- [x] T1.4: Implement `getInstallmentPayments` and `createInstallmentPayment` API endpoints in `src/services/loanService.ts`

## Phase 2: Documentation
- [x] T2.1: Create `plan.md` in `docs/loan-installtment-payment/`
- [x] T2.2: Create `tasks.md` in `docs/loan-installtment-payment/`

## Phase 3: User Interface
- [x] T3.1: Create `InstallmentPaymentsRow` component to fetch and show payment history and contain payment form
- [x] T3.2: Update `InstallmentList` to handle expand/collapse toggles, show status badges, and render `InstallmentPaymentsRow`
- [x] T3.3: Re-route UI to replace legacy "Marcar Pago" flow with expandable row controls

## Phase 4: Integration
- [x] T4.1: Connect `LoanCard` to receive and pass down refresh callbacks to `InstallmentList`
- [x] T4.2: Connect `LoanDrawer` to pass the fetchLoanDetails function as a refresh callback to `LoanCard`
- [x] T4.3: Ensure UI state remains open and expanded during refresh flow
