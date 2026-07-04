# Tasks - Loan Details Preview

## Phase 1: Documentation
- [x] Create `docs/loan-details-preview/requirements.md`
- [x] Create `docs/loan-details-preview/plan.md`
- [x] Create `docs/loan-details-preview/tasks.md`

## Phase 2: Implementation
- [x] Add calculation functions inside `LoanFormModal.tsx` for `estimatedEndDate` and `estimatedTotalAmount`
- [x] Implement UI preview labels block under the inputs of `LoanFormModal.tsx`
- [x] Ensure that labels change instantly and correctly when `principal_amount`, `interest_rate`, `installments_qty`, or `start_date` change

## Phase 3: Testing
- [x] Add unit/component tests to verify the dynamic preview calculations and correct formatting
- [x] Verify that invalid or empty inputs default safely to `-`

## Phase 4: Verification
- [x] Verify TypeScript and build compilation
