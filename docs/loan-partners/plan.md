# Implementation Plan - Buggyman Loan Management

## Objective
Implement a contextual Buggyman Loan Management feature inside the existing Buggyman page. This feature enables users to view all loans, view details/installments, create new loans, and register installment payments without navigating away from the page.

## UI Architecture
- **Right-side Drawer**: To preserve page context, selecting "Loans" on a Buggyman card opens a side drawer displaying loans specifically for that partner.
- **Collapsible Cards**: Inside the drawer, loans are shown in cards. Expanding a card loads detail data and reveals its chronological installments list.
- **Form Modal**: Creating a new loan opens a modal on top of the drawer, reusing existing modal UI styles.

## Component Structure
- `src/components/LoanDrawer.tsx`: Main side-panel layout. Contains the Header with the Buggyman's details and "New Loan" button, the Loan List, and handles loading/error states.
- `src/components/LoanCard.tsx`: Individual collapsible card representing a single loan. Displays principal, total, installments count, and status. Expands to show details and `InstallmentList`.
- `src/components/InstallmentList.tsx`: Timeline/table of installments. Highlights unpaid vs. paid items and provides a "Mark as Paid" action.
- `src/components/LoanFormModal.tsx`: Modal form with input validation (principal amount, interest rate, installments, due day, start/end dates).

## Hook Strategy
- `src/hooks/useLoans.ts`:
    - Orchestrates states: `loans` array, `loading` state, `error` state.
    - Exposes functions: `fetchLoans()`, `createLoan()`, `payInstallment()`.
    - Coordinates automatic list refreshing on successful actions.

## Service Changes
- `src/services/loanService.ts`:
    - `getByPartner(partnerId: string): Promise<Loan[]>` via `GET /loans?partner_id={partnerId}`
    - `getById(loanId: string): Promise<Loan>` via `GET /loans/{loanId}`
    - `create(data: CreateLoanRequest): Promise<Loan>` via `POST /loans`
    - `payInstallment(installmentId: string, paymentDate: string): Promise<LoanInstallment>` via `PATCH /loan-installments/{installmentId}/pay`

## State Management
- Local states for drawer open/close and active partner (`activePartnerId`) inside `Buggyman.tsx`.
- Local UI state for expanded loan card IDs (`expandedLoanId`) inside `LoanDrawer.tsx` or `LoanCard.tsx`.
- Custom hook state for loaded loan data, loading spinners, and error alerts.

## Risks & Assumptions
- **Risk**: Concurrent updates or large lists of installments causing lag.
    - *Mitigation*: Limit details rendering to the expanded loan card; memoize components using React.memo where needed.
- **Assumption**: API responses follow the exact schema provided.
- **Assumption**: A right-side drawer component doesn't exist, so we implement a custom one with Tailwind CSS transition properties.
