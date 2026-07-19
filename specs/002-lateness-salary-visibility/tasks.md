---

description: "Task list for implementing Lateness Configuration & Employee Salary Visibility"
---

# Tasks: Lateness Configuration & Employee Salary Visibility

**Input**: Design documents from `/specs/002-lateness-salary-visibility/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Not requested in the feature spec — no test tasks are included below. If you
later want hook tests for `useLatenessConfig`/`useEmployeeSalarySummary` (mirroring
`useLoans.test.ts`/`useJourney.test.ts`), note the pre-existing repo gap where
`src/test/setup.ts` is missing (`npm run test` currently fails for every suite until it's
created — see CLAUDE.md).

**Organization**: Tasks are grouped by user story (US1 = lateness config, US2 = employee
salary visibility) so each can be implemented, tested, and delivered independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 or US2
- File paths are exact and relative to the repository root

---

## Phase 1: Setup

**Purpose**: Baseline check — this is an existing codebase; no new dependencies or project
scaffolding are needed for this feature (Tailwind CSS, `lucide-react`, and `src/lib/api.ts`
already provide everything required).

- [X] T001 Run `npm run typecheck` and `npm run lint` on a clean checkout to confirm a
  passing baseline before starting (no new dependencies to install)

---

## Phase 2: Foundational

**Purpose**: N/A for this feature. User Story 1 (lateness configuration) and User Story 2
(employee salary visibility) touch fully disjoint files — separate types, services, hooks,
and components — and share no blocking infrastructure beyond what already exists
(`src/lib/api.ts`, `useAuth()`, existing Tailwind setup). There are no foundational tasks;
proceed directly to Phase 3.

---

## Phase 3: User Story 1 - HR configures lateness rules (Priority: P1) 🎯 MVP

**Goal**: Give HR administrators a screen to view and edit the system-wide lateness
configuration (expected entrance time, tolerance, deduction interval, deduction value),
backed by `GET`/`PUT /employees/lateness-config` (see `contracts/lateness-config.md`).

**Independent Test**: Log in as HR, open the new tab in the HR screen, confirm the
zeroed/disabled default loads without error, save a full set of valid values, reload and
confirm they persist, then confirm an invalid value (e.g. negative tolerance) is rejected
client-side with a clear message, and that a non-HR user cannot reach the tab.

### Implementation for User Story 1

- [X] T002 [P] [US1] Create `LatenessConfig` type in `src/types/latenessConfig.ts`
  (`enabled: boolean`, `expected_entrance_time: string`, `tolerance_minutes: number`,
  `deduction_interval_minutes: number`, `deduction_value: number`) per `data-model.md`
- [X] T003 [US1] Re-export it via `export * from './latenessConfig'` in
  `src/types/index.ts` (depends on T002)
- [X] T004 [US1] Create `src/services/latenessConfigService.ts` with `get(): Promise<LatenessConfig>`
  calling `api.get('/employees/lateness-config')` and `update(payload: LatenessConfig): Promise<LatenessConfig>`
  calling `api.put('/employees/lateness-config', payload)`, per `contracts/lateness-config.md`
  (depends on T002)
- [X] T005 [US1] Create `src/hooks/useLatenessConfig.ts`: loads the config on mount, exposes
  `config`, `loading`, `error`, and a `save(values)` method that validates client-side
  (`tolerance_minutes >= 0`, `deduction_interval_minutes > 0`, `deduction_value >= 0`, all
  five fields required) before calling `latenessConfigService.update`, surfacing a
  validation error message without a round-trip when invalid (FR-004); normalize
  `expected_entrance_time`'s optional trailing `Z` consistently when reading/writing
  (depends on T004)
- [X] T006 [US1] Create `src/components/LatenessConfigPanel.tsx`: form UI for
  enabled/expected entrance time/tolerance/deduction interval/deduction value, save button
  with loading state, inline validation/error messages, pre-filling from `useLatenessConfig`
  (depends on T005)
- [X] T007 [US1] Wire a third tab into `src/components/HR.tsx`: extend the `activeTab` union
  to include a `'lateness'` value, add a tab button, and render `<LatenessConfigPanel />`
  when active — reusing the screen's existing `canAccess` (`isSuperAdmin || isHR`) gate so
  the new tab is denied to non-HR users the same way the rest of the screen already is
  (FR-001, FR-006) (depends on T006)

**Checkpoint**: User Story 1 is fully functional and independently testable/deployable here.

---

## Phase 4: User Story 2 - Employee sees own salary impact (Priority: P2)

**Goal**: Show the authenticated employee their own gross salary, advances, lateness
minutes/days, deduction, and net salary — filterable by month — directly below the
"Registrar Ponto" button on their check-in screen, mobile-responsive down to 360px.

**⚠️ Backend dependency**: Per `/speckit-clarify` and `contracts/employee-self-service-salary.md`,
this story requires the backend to add self-scoped access (`GET /employees/me`,
`GET /employees/me/salary-summary`, `GET /employees/me/salary-advances`) since today's
contract requires `HUMAN_RESOURCES` on every `/employees/*` endpoint. The frontend tasks
below build against that proposed contract and degrade gracefully if it isn't live yet
(see T013).

**Independent Test**: Log in as an employee, open the check-in screen, confirm the new
section renders below the register button showing figures for the current month (or the
graceful fallback message if the backend dependency isn't live), confirm changing the
month/year filter refetches, confirm zero-state renders correctly for no advances/no
lateness, and confirm the layout stays single-column and fully readable at 360px width.

### Implementation for User Story 2

- [X] T008 [P] [US2] Extend `SalarySummaryResponse` in `src/types/employee.ts` to add
  `late_delay_minutes: number`, `late_days_count: number`, and
  `late_deduction_total: number | string`, matching the documented contract shape (these
  fields are already returned by the backend but missing from the current type) per
  `data-model.md`
- [X] T009 [US2] Add `getMySalarySummary(params?: { month?: number; year?: number })` and
  `getMySalaryAdvances(params?: { month?: number; year?: number })` to
  `src/services/employeeService.ts`, calling the proposed `/employees/me/salary-summary` and
  `/employees/me/salary-advances` endpoints per `contracts/employee-self-service-salary.md`;
  add a short comment referencing that contract file so the backend dependency stays visible
  in the code (depends on T008)
- [X] T010 [US2] Create `src/hooks/useEmployeeSalarySummary.ts`: fetches both self-service
  endpoints for a given month/year (defaulting to the current month/year), exposes
  `summary`, `advances`, `month`/`year` setters that refetch on change (FR-008), `loading`,
  and an `error`/`unavailable` state distinguishing a hard failure (e.g. `403`/`404` because
  the backend dependency isn't live yet) so the UI can degrade gracefully instead of
  breaking (per `research.md` §6) (depends on T009)
- [X] T011 [US2] Create `src/components/Journey/EmployeeSalarySummary.tsx`: mobile-first,
  single-column layout (no horizontal scroll down to 360px, per SC-003) showing gross
  salary, advances total, late minutes, late days, deduction total, and net salary, a
  month/year filter control, zero-value rendering for no advances/no lateness (FR-009), and
  an inline "informação indisponível no momento" fallback message when the hook reports
  `unavailable` (depends on T010)
- [X] T012 [US2] Render `<EmployeeSalarySummary />` directly below the existing "Registrar
  Ponto" button in `src/components/Journey/EmployeeJourney.tsx`, without disturbing the
  existing camera/selfie/register/history flow above it (depends on T011)
- [X] T013 [US2] Confirm the new section never accepts or exposes an `employee_id`/user
  selector in its UI — it must only ever request the current authenticated user's own data
  (FR-010), consistent with the self-scoped contract in
  `contracts/employee-self-service-salary.md` (depends on T012)

**Checkpoint**: User Story 2 is functional (or gracefully degraded pending the backend
dependency) and independently testable here, without affecting User Story 1.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final repo-wide quality gates per the project constitution.

- [X] T014 [P] Run `npm run typecheck` — must pass with no `any` introduced
- [X] T015 [P] Run `npm run lint` — must pass
- [X] T016 Confirm no `console.log`, `debugger`, or `alert` were left in any new/changed file
- [X] T017 Walk through `quickstart.md` Scenario A (User Story 1) and Scenario B (User Story
  2, including the 360px mobile check) end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Empty — nothing blocks the user stories
- **User Story 1 (Phase 3)**: Can start immediately after Phase 1; no dependency on US2
- **User Story 2 (Phase 4)**: Can start immediately after Phase 1; no dependency on US1
- **Polish (Phase 5)**: Depends on whichever of US1/US2 are in scope for this delivery

### Within Each User Story

- Types → Service → Hook → Component → Screen wiring (each task above depends on the one
  before it within its story; no task should start before its listed dependency is done)

### Parallel Opportunities

- T002 (US1 type) and T008 (US2 type) can run in parallel — different files, no shared
  dependency
- Once each story's type task is done, that story's remaining chain (service → hook →
  component → wiring) is inherently sequential (each file depends on the previous), but
  **US1's chain (T003–T007) and US2's chain (T009–T013) can run fully in parallel with each
  other**, e.g. by two different developers, since they touch entirely disjoint files
- T014 and T015 (typecheck/lint) can run in parallel with each other

---

## Parallel Example: Kicking off both stories together

```bash
# After Phase 1 setup:
Task: "Create LatenessConfig type in src/types/latenessConfig.ts"          # T002, US1
Task: "Extend SalarySummaryResponse in src/types/employee.ts"              # T008, US2
# Then each story's service → hook → component → wiring chain proceeds independently.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1 (T002–T007)
3. **STOP and VALIDATE**: run `quickstart.md` Scenario A independently
4. Deploy/demo the lateness-config tab — it has no dependency on User Story 2 or on the
   pending backend contract change

### Incremental Delivery

1. Setup → (empty Foundational) → User Story 1 → validate → deploy (MVP)
2. Add User Story 2 → validate against `quickstart.md` Scenario B (both the "backend ready"
   and "graceful fallback" paths) → deploy
3. Once the backend ships `contracts/employee-self-service-salary.md`, re-validate Scenario
   B's full-data path and update `specs/api/employees.md` by hand to reflect the real,
   live contract (per that file's convention of documenting only verified behavior)

### Parallel Team Strategy

With two developers: one takes User Story 1 (T002–T007), the other takes User Story 2
(T008–T013) — no file overlap, so both can proceed simultaneously after Phase 1.

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task
- Both user stories are independently completable, testable, and deployable
- Commit after each task or logical group
- User Story 2's backend dependency (see `contracts/employee-self-service-salary.md`) is a
  cross-team blocker for full functionality, not a frontend implementation gap — the
  frontend tasks above are fully completable regardless of backend timing, thanks to the
  graceful-degradation behavior in T010/T011
