# Implementation Plan - Loan Installment Payments

## Objective
Implement a robust loan installment payment feature where users can register multiple payments for a specific installment and track its payment history. This replaces the simple legacy "Mark Paid" functionality with precise status management (`PENDING`, `PARTIALLY_PAID`, `PAID`) and detailed payment records.

## UI Architecture
- **InstallmentList**: Lists installments, handles expand/collapse states per installment, and displays appropriate status badges. For each expanded installment, it renders `InstallmentPaymentsRow`.
- **InstallmentPaymentsRow**: An internal/new child component which receives the installment details and handles:
  1. Fetching of payment history for the given installment.
  2. Rendering the payment history table.
  3. Displaying a form to submit a new payment (amount, date, notes).
  4. Updating status and refreshing parent loan details on successful payment submission.

## Component Structure
- `InstallmentList`: Modified to support collapsible/expandable rows, replaces legacy "Mark Paid" buttons with "Pagar / Ver" toggle, and handles the rendering of `InstallmentPaymentsRow`.
- `InstallmentPaymentsRow`: New self-contained component for fetching and submitting payments.
- `LoanCard`: Connects `LoanDrawer`'s refresh capability down to `InstallmentList`.
- `LoanDrawer`: Connects state refreshes (e.g. `fetchLoanDetails`) and passes them down.

## Hook Strategy
- Use existing `useLoans` hook functions, but extend them if necessary to integrate the refresh callbacks seamlessly.
- State inside `InstallmentPaymentsRow` will manage local payments state, local fetching states (`loading`, `error`), and form states.

## Service Changes
- Already implemented `getInstallmentPayments` and `createInstallmentPayment` in `src/services/loanService.ts`.

## State Management
- Expanded rows state (`expandedId` or similar) in `InstallmentList` to manage which installment is being paid/viewed.
- Local list of payments in `InstallmentPaymentsRow` with an effect fetching payments on mount.

## Risks & Assumptions
- Multiple rapid payment submits: Prevented by disabling form fields and submit button while loading.
- Input validation: Ensure the payment amount is positive and dates are valid.
- Keeping state consistent: The parent drawer must refresh loan details, which will re-fetch installments and update their statuses dynamically without losing expanded states.
