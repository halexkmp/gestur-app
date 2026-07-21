# Quickstart: Validating the HR Work Schedule Tab

## Prerequisites

- Backend reachable at `VITE_API_URL` implementing the five endpoints already documented in
  `specs/api/employees.md` (Employee Weekly Schedule, Justified Absence, Attendance
  Verification).
- One user account with `HUMAN_RESOURCES` or `ADMIN` role.
- At least three employees to exercise the interesting states:
  1. An active employee with a Monday–Friday schedule and a linked user account that has
     checked in (journey registers) on some days but not others this month.
  2. An active employee with **no** weekly schedule configured at all.
  3. An inactive employee (`active: false`) who does have a schedule, to confirm they render
     as "no data" rather than a wall of absences.

## Setup

```bash
npm run dev
```

## Validation scenarios

Each maps to an acceptance scenario in `spec.md`.

1. **Configure a weekly schedule from the employee CRUD (User Story 1)**
   - Open Recursos Humanos → Funcionários, edit employee #1.
   - Expect: a schedule section, initially showing "no schedule configured."
   - Switch it to "configure work days," check Monday–Friday, save.
   - Reopen the same employee's edit form.
   - Expect: Monday–Friday are shown as checked (the schedule persisted).

2. **Replace an existing schedule (Acceptance Scenario 2)**
   - Edit employee #1 again, add Saturday, save, reopen.
   - Expect: Monday–Saturday now checked (full replace, not merged).

3. **Leaving the schedule untouched makes no API call (Acceptance Scenario 3)**
   - Create a brand-new employee without touching the schedule section at all.
   - Expect: no error, employee saves normally; opening it again still shows "no schedule
     configured" (not "configured, zero days").

4. **Roster grid — default view (User Story 2, FR-004/FR-005)**
   - Open the new "Escala de Trabalho" tab (positioned after Jornadas, before Configuração de
     Atrasos).
   - Expect: a grid with one row per active employee and one column per day of the current
     month; employee #1's weekdays show worked/absence coloring, weekends show as "not
     scheduled."

5. **Unjustified absence surfaces correctly (Acceptance Scenario 2/5)**
   - Pick a weekday for employee #1 with no journey register and no justification.
   - Expect: that cell is flagged as an unjustified absence (distinct color + icon from
     "worked").

6. **Justified absence takes priority over a journey register (Acceptance Scenario 3)**
   - Record a justified absence (see step 8) for a day that also has a journey register.
   - Expect: the cell shows "justified absence," not "worked."

7. **No-schedule and inactive employees render as "no data," not absences (Acceptance
   Scenario 4/5)**
   - Locate employee #2 (no schedule) and the inactive employee #3 in the grid.
   - Expect: every day for both shows a distinct "no data" treatment (not red/unjustified),
     and hovering surfaces the specific reason (e.g. "Sem escala definida" / "Funcionário
     inativo").

8. **Justify an absence from the calendar (User Story 3, Acceptance Scenario 1)**
   - Click an unjustified-absence cell for employee #1.
   - Expect: only unjustified/justified cells respond to clicks (hover a "worked" or "not
     scheduled" cell — no pointer cursor, no click action).
   - Enter an optional reason, confirm.
   - Expect: the cell updates to "justified absence" without a full page reload.

9. **Duplicate/invalid justification is rejected clearly (Acceptance Scenario 2/3)**
   - Attempt to justify the same day again.
   - Expect: an inline error message, no duplicate record, cell unchanged.

10. **Remove a justification (Acceptance Scenario 4)**
    - Click the justified-absence cell from step 8, choose remove.
    - Expect: the cell reverts to reflecting the employee's actual status (worked or
      unjustified absence) based on whether a journey register exists for that day.

11. **Month navigation (Acceptance Scenario 6)**
    - Navigate to the previous month.
    - Expect: the grid reloads and reflects that month's data; navigating back returns to the
      original view.

12. **Narrow to one employee — literal calendar view (FR-007)**
    - Use the employee filter to select employee #1 only.
    - Expect: the view switches from the roster grid to a Monday–Sunday month calendar for
      that employee alone, showing the same statuses in a calendar layout.

## Automated checks

```bash
npm run typecheck
npm run lint
npx vitest run src/lib/api.test.ts
```

`src/lib/api.test.ts` is new (see `contracts/api-error-status.md`) and is the one piece of this
feature with mandated test coverage, since it's a shared file every service depends on.
Coverage for `useEmployeeSchedule`/`useWorkSchedule` is optional per the constitution's testing
gate (new hooks, not edits to already-tested ones) but recommended given their non-trivial
derivation logic — see `data-model.md`'s state machine.
