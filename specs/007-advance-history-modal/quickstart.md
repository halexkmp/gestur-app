# Quickstart: Validating the Employee Advance History View

## Prerequisites

- `npm install` then `npm run dev`, with `VITE_API_URL` pointed at a backend implementing
  `GET /employees/salary-advances?employee_id=...` (already live and unchanged — see
  `contracts/employee-advance-history.md` for the verification performed during planning).
- An HR or Admin test account.
- At least one active employee with salary advances recorded in **more than one different
  month** (not just the currently selected period) — needed to actually see the "complete
  history, not just this month" behavior this feature adds. If no such employee exists in
  your test data, create two advances for the same employee dated in different months via
  the existing "Adiantamento Salarial" form first.
- At least one active employee with **no** advances at all, to check the empty state.

## Scenario A — View an employee's complete advance history (User Story 1)

1. Log in as the HR/Admin account, open **Recursos Humanos** → **Salário**.
2. Expand the row of the employee who has advances in multiple different months. Confirm the
   existing "Adiantamentos do período" section still shows only the current period's
   advance(s), unchanged.
3. Click "Ver histórico completo" (or equivalent label). Confirm a modal opens showing
   **every** advance for that employee, including ones from months other than the currently
   selected period (Acceptance Scenario 1).
4. Confirm each entry shows its date, amount, and note (when one was recorded), and that the
   list is ordered most-recent-first (Acceptance Scenario 2).
5. Confirm the modal displays the total of all advances shown, matching the sum you'd get by
   adding the individual amounts yourself (Acceptance Scenario 3).
6. Close the modal (via the `X` button). Confirm you're back on the Salário tab with the same
   period, the same row still expanded, and the same employee filter selection as before
   (Acceptance Scenario 5).

**Pass condition**: all six checks above hold.

## Scenario B — Empty and error states

1. Expand the row of an employee with no recorded advances at all. Open the history view.
   Confirm a clear "nenhum adiantamento registrado" (or equivalent) message appears, not a
   blank panel (Acceptance Scenario 4).
2. Temporarily break connectivity to the backend (or point `VITE_API_URL` at an unreachable
   host), then open the history view for any employee. Confirm a clear error message with a
   retry option appears. Restore connectivity and click retry; confirm the history then loads
   normally.

**Pass condition**: both checks hold.

## Scenario C — Read-only scope check

1. With the history view open, confirm there is no way to create, edit, or delete an advance
   from within it — those actions remain available only in the existing "Adiantamentos do
   período" section behind it (spec FR-008).

**Pass condition**: the check holds.

## Automated checks

- `npm run typecheck` — must pass (strict TypeScript, no `any`).
- `npm run lint` — must pass.
- If `src/hooks/useEmployeeAdvanceHistory.test.ts` is added (recommended, not mandated — see
  `plan.md` Testing), run `npx vitest run src/hooks/useEmployeeAdvanceHistory.test.ts` and
  confirm it passes.
