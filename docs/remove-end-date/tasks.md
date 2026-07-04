# Tasks - Remove End Date

## Phase 1: Documentation
- [x] Create `docs/remove-end-date/requirements.md`
- [x] Create `docs/remove-end-date/plan.md`
- [x] Create `docs/remove-end-date/tasks.md`

## Phase 2: Types Update
- [x] Update `src/types/loan.ts` to remove `end_date` from `CreateLoanRequest`

## Phase 3: Component Update
- [x] Remove `end_date` from `LoanFormModal.tsx` form state, validation, and payload mapping
- [x] Remove `end_date` input element from the `LoanFormModal.tsx` UI layout

## Phase 4: Test Update
- [x] Remove `end_date` from `src/hooks/useLoans.test.ts` creation mock

## Phase 5: Verification
- [x] Verify TypeScript and build compilation
