# Quickstart: Validating Salary Tab Bulk Data Loading

## Prerequisites

- `npm install` then `npm run dev` (Vite dev server), with `VITE_API_URL` pointed at a backend
  that has `GET /employees/salary-summary` (bulk form, no `{employee_id}`) live — confirmed in
  `specs/api/employees.md`'s "Salary Summary (All Employees)" section and summarized in
  `contracts/salary-summary-overview.md`.
- An HR or Admin test account.
- At least 3 active employees with non-zero `salary`, at least one with a salary advance
  recorded in the period you'll test, and at least one with none. Ideally at least one
  **inactive** employee too, to confirm they're correctly excluded from the table (the
  endpoint itself returns all employees, active or not — the frontend still filters).
- Browser dev tools open to the Network tab, to count requests.

## Scenario A — All employees load together (User Story 1)

1. Log in as the HR/Admin account, open **Recursos Humanos** → **Salário**.
2. Confirm every active employee's row already shows gross salary, advance deductions,
   lateness deduction, and net salary — not just the base salary placeholder — without
   expanding any row (Acceptance Scenario 1).
3. In the Network tab, count the requests fired by this load. Expect exactly 2 (the employee
   list + the bulk overview), regardless of how many employees are active (Acceptance
   Scenario 3, SC-002) — contrast with today's behavior of 1 request plus 2 more per row
   expanded.
4. Expand any employee's row. Confirm the detail panel opens with no loading spinner and
   fires no additional network request (Acceptance Scenario 2).

**Pass condition**: all four checks above hold.

## Scenario B — Advances arrive with the summary (User Story 2)

1. Expand the row of the employee with a recorded advance in the test period. Confirm the
   advance(s) are already listed — no separate loading state resolves into the list.
2. Expand the row of the employee with no advances in the period. Confirm "Nenhum
   adiantamento neste período" (or equivalent empty state) shows immediately.
3. Create a new advance for an employee (via the existing "Novo Adiantamento" form). Confirm,
   once the action completes, that employee's advances total, net salary, and advances list
   all update without you reloading the page (Acceptance Scenario 3).
4. Delete that advance. Confirm the same fields revert without a manual reload.
5. Repeat step 4 with a **second** employee's advance while the first employee's row is also
   expanded. Confirm each delete removes the correct employee's advance and never the other's
   — this specifically guards against a real risk this feature introduces: the embedded
   advance item has no `employee_id` of its own (see `data-model.md`), so the delete call must
   be wired using the parent row's `employee_id`, not anything read off the advance object.

**Pass condition**: all five checks above hold, and no per-row "loading advances" state is
ever visible.

## Scenario C — Period and employee filters still work

1. Change the month or year filter. Confirm all rows refresh to the new period's figures
   (existing behavior, now backed by one bulk re-fetch instead of a targeted per-row
   re-fetch).
2. Use the employee filter dropdown added just before this feature. Confirm it still narrows
   the table to one employee with no additional network request (it filters already-loaded
   data).

**Pass condition**: both checks hold.

## Scenario D — Bulk load failure

1. Temporarily point `VITE_API_URL` at an unreachable host, or otherwise force the bulk
   request to fail.
2. Confirm the tab shows a single error state with a retry button covering the whole table,
   not a per-row error (FR-006).
3. Restore the correct `VITE_API_URL` / connectivity and click retry. Confirm the table
   recovers.

**Pass condition**: all three checks hold.

## Automated checks

- `npm run typecheck` — must pass (strict TypeScript, no `any`); verifies the new
  `SalarySummaryOverviewAdvance`/`SalarySummaryOverviewItem`/`SalarySummaryOverviewResponse`
  types and the rewritten `useEmployeePaychecks` compile cleanly against the updated
  `EmployeePaycheckRow`/`EmployeePaycheckDetail` prop types.
- `npm run lint` — must pass.
- `npx vitest run src/hooks/useEmployeePaychecks.test.ts` — must pass. This file already
  exists with 7 tests asserting the old lazy per-employee behavior; `tasks.md` T007/T008/T014/
  T015 rewrite them to match the new bulk behavior. `src/test/setup.ts` is already present in
  this checkout, so `npm run test` is not blocked by the gap noted in `CLAUDE.md`.
