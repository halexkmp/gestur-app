# Implementation Plan - Edit Loan Status

## Objective
Implement an option to edit the status of a loan inside the loan management interface, selecting from ACTIVE, PAID, and CANCELED status options and calling the backend API to save the change.

## UI Architecture
- **Dropdown Selector**: Inside `LoanCard.tsx` (when expanded), a select dropdown will allow users to view and change the loan's status.
- **Loading State**: An inline loader will indicate when a status change is in progress.

## Component Structure
- `src/components/LoanCard.tsx`: Add a status selection dropdown inside the expanded section of the card. When a new status is chosen, it will trigger an update callback.
- `src/components/LoanDrawer.tsx`: Pass down an update callback handler that links the `LoanCard` to the `useLoans` hook's update function.

## Hook Strategy
- `src/hooks/useLoans.ts`:
    - Expose an `updateLoanStatus(loanId: string, status: LoanStatus): Promise<Loan>` function.
    - Update the local `loans` list with the returned loan or new status to provide optimistic/immediate UI updates.

## Service Changes
- `src/services/loanService.ts`:
    - Add `update(loanId: string, data: Partial<Loan>): Promise<Loan>` via `PUT /loans/{loanId}`.

## State Management
- Local loading states per loan during status transition.
- Update global `loans` array state inside the custom hook upon successful API response.

## Risks & Assumptions
- **Risk**: Backend expects specific fields in `PUT /loans/{loanId}` that might not be present or might trigger validation errors if null.
    - *Mitigation*: Ensure `LoanUpdateRequest` matching of fields, or pass the status as defined in the OpenAPI schema.
- **Assumption**: Only `status` field is modified, and the backend handles this update correctly via `PUT`.
