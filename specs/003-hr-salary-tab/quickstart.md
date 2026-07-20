# Quickstart: Validating the HR Salary Tab

## Prerequisites

- Backend reachable at `VITE_API_URL` with at least 2 active employees, at least one with a
  salary advance in the current month, and (ideally) an enabled lateness configuration with
  at least one late check-in recorded for one employee.
- A user account with the `HUMAN_RESOURCES` or `ADMIN`/super-admin role (per
  `specs/api/employees.md` and `src/contexts/AuthContext.tsx`).

## Setup

```bash
npm run dev
```

Log in as the HR/admin user, navigate to the HR page (Recursos Humanos), and open the tab
now labeled **"Salário"** (previously "Adiantamentos").

## Validation scenarios

Each maps to an acceptance scenario in `spec.md`.

1. **Default paycheck view (User Story 1 / SC-001)**
   - Open the Salário tab with no filters touched.
   - Expect: every active employee listed with gross salary, advance discount, lateness
     discount, and net salary for the current month — no employee-selection step required.
   - Expect: an employee with no advances/lateness this month shows `R$ 0,00` discounts, not
     a blank cell or error.

2. **Change period (FR-004)**
   - Change the month/year selector to a past month known to have data.
   - Expect: all rows' figures update to that period.

3. **Discount breakdown drill-down (User Story 2 / FR-005, FR-006)**
   - Expand/select the employee known to have salary advances and lateness deductions.
   - Expect: individual advance entries (amount, date, note) are listed and sum to that
     employee's advance discount shown in the summary row.
   - Expect: lateness detail (late days count, total minutes late) is shown and consistent
     with the summary row's lateness discount.

4. **Zero/disabled states (FR-010, FR-011, Edge Cases)**
   - With the lateness configuration disabled (or an employee/period with none), confirm
     lateness discount and detail show as zero/none, not an error.
   - With an employee with no advances in the period, confirm advance discount shows zero.

5. **Register a new salary advance (User Story 3 / SC-003)**
   - Trigger the "new advance" action, submit a valid advance for an employee (amount, date,
     optional note, optional installments).
   - Expect: without leaving the tab, that employee's advance discount and net salary update,
     and the new entry appears in their itemized breakdown.
   - Repeat with `times > 1` and confirm multiple installment entries appear.

6. **Delete a salary advance (FR-008, User Story 3 scenario 3)**
   - From an employee's itemized breakdown, delete one advance entry.
   - Expect: that employee's advance discount and net salary update to exclude it, without
     leaving the tab.

7. **Access control (FR-012)**
   - Log in as a non-HR, non-admin role and confirm the HR page (and thus the Salário tab)
     is not accessible, matching current `HR.tsx` access-denied behavior.

## Automated checks

```bash
npm run typecheck
npm run lint
npx vitest run src/hooks/useEmployeePaychecks.test.ts
```

(See `CLAUDE.md`'s known-issue note about `src/test/setup.ts` if `npm run test` fails to
locate the Vitest setup file — resolve that first if this feature adds a new hook test.)
