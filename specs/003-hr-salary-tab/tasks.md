---

description: "Task list for HR Salary Tab"
---

# Tasks: HR Salary Tab

**Input**: Design documents from `/specs/003-hr-salary-tab/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/employee-paychecks-hook.md, quickstart.md

**Tests**: Not explicitly requested in spec.md — no TDD/contract-test tasks are included per user stories. A hook unit test is included as an optional Polish task (T019) since `plan.md` earmarks `useEmployeePaychecks.test.ts` following the existing `useLoans.test.ts` convention.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2/P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact and relative to the repository root

## Path Conventions

Single existing frontend project (Vite/React SPA) — all paths under `src/`, per `plan.md`'s Project Structure.

---

## Phase 1: Setup

**Purpose**: No project initialization needed — this is a refactor within an existing, already-configured app (no new dependencies, no new tooling). Nothing to do here; proceed to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared type, shared data hook, and tab-shell wiring that every user story builds on. Also delivers FR-001 (the rename) immediately.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Add `EmployeePaycheck` view-model type to `src/types/employee.ts` per `data-model.md` (fields: `employee_id`, `employee_name`, `month`, `year`, `gross_salary`, `advances_total`, `late_delay_minutes`, `late_days_count`, `late_deduction_total`, `net_salary`); no changes needed to `src/types/index.ts` since it already does `export * from './employee'`
- [X] T002 [P] Create placeholder `src/components/HR/SalaryTab.tsx` — a component accepting `employees: Employee[]` as a prop, rendering only a heading ("Salário") and a TODO container for now (filled in by User Story 1)
- [X] T003 Create `src/hooks/useEmployeePaychecks.ts` implementing the core of the contract in `contracts/employee-paychecks-hook.md`: `month`/`year` state (defaulting to current month/year, mirroring `useEmployeeSalarySummary.ts`), `setMonth`/`setYear`, and a `paychecks: EmployeePaycheck[]` loader that calls `employeeService.getAll()` filtered to `active === true`, then `employeeService.getSalarySummary(id, { month, year })` for each active employee in parallel via `Promise.all`, zips them into `EmployeePaycheck[]`, and exposes `loading`/`error` booleans; re-runs whenever `month`/`year` changes (depends on T001 for the type)
- [X] T004 Refactor `src/components/HR.tsx`: rename the tab id from `'advances'` to `'salary'` and its label from "Adiantamentos" to "Salário" in the tab bar; remove the inline advances-tab state and handlers that will be superseded (`advances`, `advLoading`, `advanceForm`, `summary`, `reportEmployeeId`/`reportMonth`/`reportYear`, `loadAdvances`, `loadSummary`, `submitAdvance`, `deleteAdvance`, and the associated `useEffect`s), and render `<SalaryTab employees={employees} />` (from T002) when `activeTab === 'salary'`; update the page subtitle text ("Gerencie funcionários e adiantamentos salariais") to reflect the new salary/paycheck purpose (depends on T002)

**Checkpoint**: Foundation ready — tab is renamed and routes to a (currently empty) `SalaryTab`; user story implementation can now begin.

---

## Phase 3: User Story 1 - View current paycheck for each employee (Priority: P1) 🎯 MVP

**Goal**: Opening the Salário tab shows, by default, every active employee's gross salary, advance discount, lateness discount, and net salary for the current month, with a month/year selector to change the period.

**Independent Test**: Open the Salário tab with no filters touched; confirm every active employee is listed with correct gross/advance/lateness/net figures for the current month; change month/year and confirm figures update; confirm an employee with no advances/lateness shows zero, not blank/error.

### Implementation for User Story 1

- [X] T005 [US1] Add month/year filter controls to `src/components/HR/SalaryTab.tsx`, wired to `useEmployeePaychecks()`'s `month`/`year`/`setMonth`/`setYear` (reuse the pt-BR month-name `<select>` + year `<input>` pattern already used in `src/components/Journey/EmployeeSalarySummary.tsx`)
- [X] T006 [P] [US1] Create `src/components/HR/EmployeePaycheckRow.tsx` rendering one `EmployeePaycheck`'s employee name, gross salary, advance discount, lateness discount, and net salary, reusing the color-coding convention (blue=gross, orange=advances, red=lateness, green=net) and `R$ X.XX` formatting from `EmployeeSalarySummary.tsx`; render `R$ 0.00` (not blank) when a discount is zero, per FR-010/FR-011
- [X] T007 [US1] Wire `src/components/HR/SalaryTab.tsx` to render one `EmployeePaycheckRow` (T006) per entry in `useEmployeePaychecks().paychecks`, with a loading skeleton while `loading` is true, an error state with retry when `error` is true, and an empty state when there are no active employees (depends on T005, T006)
- [X] T008 [P] [US1] Make the paycheck list responsive: collapse to stacked cards on narrow viewports, matching the existing employee table's `overflow-x-auto` pattern in `src/components/HR.tsx`, applied in `src/components/HR/SalaryTab.tsx` / `EmployeePaycheckRow.tsx`

**Checkpoint**: User Story 1 is fully functional and independently testable — the Salário tab shows every active employee's current paycheck by default.

---

## Phase 4: User Story 2 - Inspect discount breakdown for an employee (Priority: P2)

**Goal**: From the paycheck list, an HR user can drill into one employee to see itemized salary advances and lateness detail (late days count, total minutes late) backing that employee's discounts.

**Independent Test**: Select/expand one employee with advances and lateness deductions; confirm itemized advances sum to the shown advance discount, and lateness detail (days/minutes) is consistent with the shown lateness discount; confirm zero/none states render cleanly when there's no lateness config or no advances.

### Implementation for User Story 2

- [X] T009 [US2] Extend `src/hooks/useEmployeePaychecks.ts` with `getAdvancesForEmployee(employeeId)` and `loadAdvancesForEmployee(employeeId)` per `contracts/employee-paychecks-hook.md`, backed by `employeeService.listSalaryAdvances({ employee_id, month, year })`, caching per-employee results keyed by employee id so `getAdvancesForEmployee` returns `undefined` until loaded and `[]` when loaded-but-empty (depends on T003)
- [X] T010 [P] [US2] Create `src/components/HR/EmployeePaycheckDetail.tsx` rendering: (a) the itemized salary advances for an employee (amount, date, note) reusing the existing advances-table row styling from `src/components/HR.tsx`, and (b) lateness detail (late days count, total minutes late) reusing the "Atraso" card styling from `EmployeeSalarySummary.tsx`
- [X] T011 [US2] Add an expand/collapse toggle to `src/components/HR/EmployeePaycheckRow.tsx` that calls `loadAdvancesForEmployee` on first expand and renders `EmployeePaycheckDetail` (T010) inline (accordion-style) using data from `getAdvancesForEmployee` and the row's own `EmployeePaycheck` (depends on T009, T010)
- [X] T012 [US2] In `src/components/HR/EmployeePaycheckDetail.tsx`, render explicit zero/none messaging (not blank) when `late_delay_minutes`/`late_days_count`/`late_deduction_total` are all zero (lateness disabled or unconfigured, per FR-010) and when the itemized advances list is empty (per FR-011) (depends on T010)

**Checkpoint**: User Stories 1 AND 2 both work independently — paycheck list plus per-employee breakdown.

---

## Phase 5: User Story 3 - Register a new salary advance (Priority: P3)

**Goal**: HR can still register a new salary advance (amount, date, optional note, optional installments) from the Salário tab, and delete an existing advance — both reflected in the affected employee's paycheck without leaving the tab.

**Independent Test**: Submit a new advance for an employee and confirm their advance discount/net salary update and the entry appears in their itemized breakdown, including with `times > 1` producing multiple installment entries; delete an advance and confirm the figures update to exclude it.

### Implementation for User Story 3

- [X] T013 [US3] Extend `src/hooks/useEmployeePaychecks.ts` with `createAdvance(payload)` and `deleteAdvance(advanceId, employeeId)` per `contracts/employee-paychecks-hook.md`, calling `employeeService.createSalaryAdvance` / `deleteSalaryAdvance` unchanged, then re-fetching that employee's `getSalarySummary` and advances list on success so `paychecks` and `getAdvancesForEmployee` reflect the change (depends on T003, T009)
- [X] T014 [P] [US3] Create `src/components/HR/NewAdvanceForm.tsx` with the employee/amount/date/times/note fields, reusing the field layout and validation (`employee_id` + `amount` required) from the current inline form in `src/components/HR.tsx`, calling `onSubmit` with a `CreateSalaryAdvanceRequest`
- [X] T015 [US3] In `src/components/HR/SalaryTab.tsx`, add a clearly labeled "Novo Adiantamento" action (button) that opens `NewAdvanceForm` (T014) in an inline panel — closed by default, per the plan's UX approach of keeping the paycheck table as the default view — and calls `useEmployeePaychecks().createAdvance` on submit (depends on T013, T014)
- [X] T016 [US3] In `src/components/HR/EmployeePaycheckDetail.tsx`, add a delete action to each itemized advance entry that confirms (mirroring the existing `confirm(...)` pattern in `src/components/HR.tsx`) and calls `useEmployeePaychecks().deleteAdvance` (depends on T013, T010)

**Checkpoint**: All three user stories are independently functional — the Salário tab fully replaces the old Adiantamentos tab's capabilities in the new paycheck-first layout.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation once all desired stories are complete.

- [X] T017 [P] Remove now-unused imports/state/types left in `src/components/HR.tsx` after the Phase 2/3/5 extraction (e.g. unused `DollarSign`/`Calendar`/`FileText` icon imports, `SalaryAdvance`/`SalarySummaryResponse` type imports no longer referenced directly in this file)
- [X] T018 Run `npm run lint` and `npm run typecheck` and fix any issues surfaced across the new/changed files
- [X] T019 [P] Add `src/hooks/useEmployeePaychecks.test.ts` covering: default paycheck fetch/composition, month/year change re-fetch, `getAdvancesForEmployee` undefined-until-loaded behavior, and `createAdvance`/`deleteAdvance` triggering a re-fetch of the affected employee — following the `vi.mock('../services/employeeService')` + `renderHook` conventions in `src/hooks/useLoans.test.ts`
- [ ] T020 Execute the manual validation scenarios in `quickstart.md` against a running `npm run dev` instance (all 7 scenarios, including the non-HR access-control check) — **not completed**: `VITE_API_URL` in `.env` points to a stale/unreachable ngrok tunnel, so no live backend was available in this environment to exercise real login + data. Verified instead: `npm run build` succeeds, `npm run dev` serves the app with no startup errors, and the full Vitest suite (16/16, including the 6 new hook tests) passes. Run the 7 quickstart scenarios against a live backend before merging.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — no tasks.
- **Foundational (Phase 2)**: No dependencies beyond the existing codebase — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (T001–T004) completion. No dependency on US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational completion. Extends the same hook file (T003) and reads the same `EmployeePaycheckRow` (T006) that US1 created, so in practice implement after US1, though its acceptance scenarios don't require US1's polish tasks (T008) to be done.
- **User Story 3 (Phase 5)**: Depends on Foundational completion, and (for T016) on US2's `EmployeePaycheckDetail` (T010) existing to attach the delete action to. Implement after US2.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable after Foundational — no dependency on US2/US3.
- **User Story 2 (P2)**: Builds on the `useEmployeePaychecks` hook and `EmployeePaycheckRow` component from Foundational/US1, but its own acceptance scenarios (itemized advances, lateness detail) are independently verifiable once its tasks are done.
- **User Story 3 (P3)**: Builds on the hook (Foundational) and `EmployeePaycheckDetail` (US2, for the delete action placement) — independently verifiable (create + delete an advance and observe the totals update) once its tasks are done.

### Within Each User Story

- Hook extension before component wiring (e.g., T009 before T011; T013 before T015/T016).
- New leaf components (`EmployeePaycheckRow`, `EmployeePaycheckDetail`, `NewAdvanceForm`) before the container (`SalaryTab`) wires them in.
- Story complete (checkpoint) before moving to the next priority.

### Parallel Opportunities

- T001 and T002 (Foundational) can run in parallel — different files, no shared dependency.
- T006 and T008 (US1) touch different concerns and can be parallelized once T005 lands, though both ultimately edit related files — treat as parallel-safe only if worked by different people; otherwise sequential is simpler.
- T010 (US2) can be built in parallel with T009 (different files: component vs. hook) since T011 is the only task that needs both finished.
- T014 (US3) can be built in parallel with T013 (different files: component vs. hook) since T015 needs both finished.
- T017 and T019 (Polish) can run in parallel — different files.

---

## Parallel Example: Foundational

```bash
# T001 and T002 touch different files and have no dependency on each other:
Task: "Add EmployeePaycheck type to src/types/employee.ts"
Task: "Create placeholder SalaryTab.tsx in src/components/HR/SalaryTab.tsx"
```

## Parallel Example: User Story 2

```bash
# T009 (hook) and T010 (component) touch different files:
Task: "Extend useEmployeePaychecks.ts with getAdvancesForEmployee/loadAdvancesForEmployee"
Task: "Create EmployeePaycheckDetail.tsx rendering itemized advances + lateness detail"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001–T004) — delivers the rename (FR-001) immediately.
2. Complete Phase 3: User Story 1 (T005–T008).
3. **STOP and VALIDATE**: Run quickstart.md scenarios 1 and 2 (default paycheck view, period change).
4. This alone already satisfies the tab's new stated purpose ("show the current payment check for each employee") even before breakdown/creation are added.

### Incremental Delivery

1. Foundational → tab renamed, empty Salário tab.
2. + User Story 1 → paycheck table live → demo-able MVP.
3. + User Story 2 → discount breakdown drill-down → demo-able.
4. + User Story 3 → advance create/delete restored → feature-complete, matches spec fully.
5. + Polish → cleanup, hook test, full quickstart pass.

### Notes

- [P] tasks = different files, no unmet dependencies.
- [Story] label maps each task to its user story for traceability back to `spec.md`.
- No task modifies `src/services/employeeService.ts` or any backend contract — confirmed unnecessary by the `api-contract-check` hook at spec time.
- Commit after each task or logical group, per repository convention.
