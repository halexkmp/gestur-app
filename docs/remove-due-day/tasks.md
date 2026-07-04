# Tasks - Remove Due Day

## Phase 1: Documentation
- [x] Create `docs/remove-due-day/requirements.md`
- [x] Create `docs/remove-due-day/plan.md`
- [x] Create `docs/remove-due-day/tasks.md`

## Phase 2: Types Update
- [x] Update `src/types/loan.ts` to remove `due_day` from `Loan` and `CreateLoanRequest`

## Phase 3: Component Update
- [x] Remove `due_day` from `LoanFormModal.tsx` form UI
- [x] Remove `due_day` from `LoanFormModal.tsx` state and validation
- [x] Remove `due_day` from `LoanFormModal.tsx` payload

## Phase 4: Test Update
- [x] Remove `due_day` from `src/hooks/useLoans.test.ts`

## Phase 5: Verification
- [x] Verify TypeScript and build compilation
