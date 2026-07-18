# Quickstart: Validate Employee ↔ User Linking

Automated tests are not required for this feature (see `plan.md` Technical Context) — validate
manually against a real (or staging) backend that supports `user_id` on `/employees/*` per
`specs/api/employees.md`.

## Prerequisites

- `VITE_API_URL` pointed at a backend with the `user_id` field live on employee endpoints.
- An account with `HUMAN_RESOURCES` (or `ADMIN`) role to log into the HR page.
- At least one existing `User` with the `EMPLOYEE` or `OPERATOR` role that is **not** already
  linked to any employee, to exercise the "link existing" path.

## Setup

```bash
npm run dev
```

Log in, navigate to **Recursos Humanos** (HR page).

## Scenario 1 — Link a new employee to an existing user (User Story 1, FR-001/002/004)

1. Click **Novo Funcionário**.
2. Fill name/salary/start date as usual.
3. In the account-link section, choose "link an existing account," search for the prepared
   unlinked EMPLOYEE/OPERATOR user by name or username, select it.
4. Submit.
5. **Expected**: employee is created; the employee list shows the linked-account indicator for
   this row (FR-011).
6. Re-open the form for a *different* user already linked to another employee (or a MANAGER/ADMIN
   user) and confirm it does **not** appear in the picker (FR-002).

## Scenario 2 — Create a new user inline while creating an employee (User Story 2, FR-003)

1. Click **Novo Funcionário**.
2. Fill name/salary/start date.
3. Choose "create a new account," enter a username/password.
4. Submit.
5. **Expected**: both the employee and a new user exist and are linked; check the Users page to
   confirm the new account has only the `EMPLOYEE` role and no role picker was shown.
6. Repeat with a username that already exists (e.g., reuse the previous one) — expect a clear
   inline error and no employee created (FR-009), with previously entered fields still filled in.
7. Repeat leaving username or password blank — expect the form to block submission (FR-010).

## Scenario 3 — Edit: switch or remove a linked account (User Story 3, FR-005/006)

1. Open **Editar** on the employee created in Scenario 1.
2. **Expected**: the currently linked user is shown pre-selected.
3. Switch the selection to a different eligible user, save.
4. **Expected**: the employee's linked account updates; re-open the users list and confirm the
   *previous* user account still exists (FR-006), just unlinked.
5. Open **Editar** again, clear the account selection entirely ("no linked account"), save.
6. **Expected**: employee shows no linked account in the list; the user record from step 3 still
   exists untouched.

## Scenario 4 — Deleting an employee doesn't touch the linked user (FR-007)

1. Link an employee to a user (Scenario 1 or 2).
2. Delete that employee from the HR page.
3. **Expected**: the linked user account still exists and is still active on the Users page.

## Scenario 5 — Degraded picker when no eligible candidates exist

1. As an HR user without ADMIN (so `GET /users/` returns only themselves, per
   `specs/api/shared.md`), open **Novo Funcionário** and go to link an existing account.
2. **Expected**: the picker shows an empty/no-candidates state rather than an error, and
   "create a new account" remains available and functional.
