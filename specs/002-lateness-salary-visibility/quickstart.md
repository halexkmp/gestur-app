# Quickstart: Validating Lateness Configuration & Employee Salary Visibility

## Prerequisites

- `npm install` then `npm run dev` (Vite dev server), with `VITE_API_URL` pointed at a
  backend that has `specs/api/employees.md`'s `lateness-config` endpoints live.
- Two test accounts: one with the `HUMAN_RESOURCES` (or `ADMIN`) role, one with only the
  `EMPLOYEE` role, linked to an `Employee` record with a non-zero `salary`.
- For User Story 2 end-to-end validation: the backend must also implement the self-service
  contract in `contracts/employee-self-service-salary.md` (`GET /employees/me`,
  `GET /employees/me/salary-summary`, `GET /employees/me/salary-advances`). Until then, only
  the graceful-degradation path (inline "informação indisponível" message) is verifiable.

## Scenario A — HR configures lateness rules (User Story 1)

1. Log in as the HR/admin account.
2. Open **Recursos Humanos** → the new lateness-configuration tab.
3. Confirm: on first load (no config saved yet), the rule shows disabled with zeroed
   fields — not an error (spec Acceptance Scenario 1).
4. Set expected entrance time `08:00:00`, tolerance `10` minutes, deduction interval `30`
   minutes, deduction value `25.00`, enable the rule, save.
5. Reload the page / re-open the tab. Confirm the same values are pre-filled (Scenario 2).
6. Try saving with tolerance `-1`. Confirm the save is blocked with a clear message
   (Scenario 4).
7. Log out, log in as the `EMPLOYEE`-only account, confirm this tab/screen is not reachable
   (Scenario 5).

**Pass condition**: all six checks above hold.

## Scenario B — Employee sees their own salary impact (User Story 2)

1. Log in as the `EMPLOYEE`-only test account.
2. Open the journey check-in screen ("Minha Jornada"). Confirm a new section appears
   directly below the "Registrar Ponto" button.
3. If the backend self-service contract (see Prerequisites) is live: confirm the section
   shows gross salary, advances total, late minutes/days, deduction total, and net salary
   for the current month (Scenario 1), and that changing the month/year filter updates the
   figures (Scenario 2).
4. If that backend contract is **not** yet live: confirm the section shows the inline
   "informação indisponível no momento" fallback rather than crashing the screen, and that
   the "Registrar Ponto" button and journey history above it still work normally.
5. Resize the browser (or use device emulation) to 360px width. Confirm the section remains
   single-column, fully readable, with no horizontal scroll or clipped content (Scenario 5,
   SC-003).

**Pass condition**: check-in flow is unaffected either way; the salary section is either
fully functional (if backend is ready) or gracefully degraded (if not), and is mobile-usable
at 360px in both cases.

## Automated checks

- `npm run typecheck` — must pass (strict TypeScript, no `any`).
- `npm run lint` — must pass.
- `npx vitest run src/hooks/useLatenessConfig.test.ts` (once added, mirroring
  `useLoans.test.ts`) and `npx vitest run src/hooks/useEmployeeSalarySummary.test.ts` — note
  the existing repo-wide gap where `src/test/setup.ts` is missing (see CLAUDE.md); fix it if
  these new tests are added, since otherwise `npm run test` fails for every suite, not just
  the new ones.
