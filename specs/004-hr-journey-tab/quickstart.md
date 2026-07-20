# Quickstart: Validating the HR Journey Tab

## Prerequisites

- Backend reachable at `VITE_API_URL` with at least one employee with journey (check-in)
  records, ideally including one with an attached selfie and one flagged as late (lateness
  config enabled, per `specs/003-hr-salary-tab`'s existing lateness feature).
- One user account with `HUMAN_RESOURCES` or `ADMIN` role (can access HR/journey moderation).
- One user account with neither role, to verify the negative case.

## Setup

```bash
npm run dev
```

## Validation scenarios

Each maps to an acceptance scenario in `spec.md`.

1. **Menu no longer shows "Gerenciar Jornadas" (FR-001)**
   - Log in as the HR/admin user.
   - Expect: the top-level sidebar menu has no "Gerenciar Jornadas" entry.

2. **New Jornadas tab, correctly positioned (User Story 1, FR-002)**
   - Open the HR page (Recursos Humanos).
   - Expect: tabs read, in order, Funcionários → Salário → Jornadas → Configuração de
     Atrasos — Jornadas is present, and Configuração de Atrasos is still last.
   - Open the Jornadas tab.
   - Expect: the same journey-record list, filters (employee, date range), and (when a
     lateness config is active) the "only delayed" toggle and delay column, exactly as the
     old standalone page showed.

3. **Selfie viewer (Acceptance Scenario 4)**
   - From the Jornadas tab, open a record with a selfie.
   - Expect: the same full-screen selfie viewer as before.

4. **Edit a record (User Story 2)**
   - Edit a record's date/time and/or coordinates.
   - Expect: saving without a reason is blocked; saving with a reason succeeds and the list
     reflects the new values.

5. **Delete a record (User Story 3)**
   - Delete a record, confirm the prompt, confirm it disappears from the list; cancel a
     second delete and confirm the record remains.

6. **Visibility unchanged (FR-003/FR-009, SC-003)**
   - Log in as the non-HR/non-admin user.
   - Expect: no HR menu entry at all (unchanged from before this refactor), and no way to
     reach journey moderation.

7. **Self-service journey untouched (FR-010)**
   - Log in as a pure EMPLOYEE-role user (or check the "Minha Jornada" menu entry as any
     employee).
   - Expect: "Minha Jornada" self-service check-in still works exactly as before — unaffected
     by this refactor.

## Automated checks

```bash
npm run typecheck
npm run lint
npx vitest run src/hooks/useJourney.test.ts
```

`useJourney.test.ts` is unchanged by this feature (the hook itself doesn't change) — this is
a regression check, not new coverage. See `research.md` for why no test updates are required
for correctness.
