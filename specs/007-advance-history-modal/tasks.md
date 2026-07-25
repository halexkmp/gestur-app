---

description: "Task list for Employee Advance History View"
---

# Tasks: Employee Advance History View

**Input**: Design documents from `/specs/007-advance-history-modal/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/employee-advance-history.md, quickstart.md

**Tests**: Not explicitly requested in `spec.md`. This introduces one new hook with no
existing test file to protect, so per the project constitution a test is not mandated —
included as an optional, non-blocking Polish task (T008) rather than a required one.

**Organization**: This feature has a single user story (P1) per `spec.md` — all
implementation tasks live in one phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (US1 — the only one in this feature)
- File paths are exact and relative to the repository root

## Path Conventions

Single existing frontend project (Vite/React SPA) — all paths under `src/`, per `plan.md`'s
Project Structure.

---

## Phase 1: Setup

**Purpose**: No project initialization needed — existing, already-configured app, no new
dependencies. Nothing to do here; proceed to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The one shared service method the story's hook depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 In `src/services/employeeService.ts`, re-add
  `listSalaryAdvances: (employee_id: string) => api.get<SalaryAdvance[]>
  ('/employees/salary-advances', { params: { employee_id } })`, placed next to the existing
  "Salary Advances" section (`createSalaryAdvance`/`deleteSalaryAdvance`). Note this is
  narrower than the version removed in feature `006-salary-bulk-summary` — no `month`/`year`
  params, since this feature always wants the complete history, never a period-scoped one.
  `SalaryAdvance` is already imported in this file; no new import needed.

**Checkpoint**: Foundation ready — the complete-history endpoint is callable through the
service layer; user story implementation can now begin.

---

## Phase 3: User Story 1 - Review an employee's complete advance history (Priority: P1) 🎯 MVP

**Goal**: From an employee's already-expanded row on the Salário tab, HR can open a read-only
view showing every salary advance ever recorded for that employee — not just the ones in the
currently selected month/year — with each entry's date/amount/note, most-recent-first
ordering, and an automatic total.

**Independent Test**: Expand an employee's row on the Salário tab (an employee with advances
in more than one month), click the new "Ver histórico completo" entry point, and confirm
every advance for that employee appears regardless of the currently selected period, with the
correct total, without needing to change the period filter.

### Implementation for User Story 1

- [X] T002 [US1] Create `src/hooks/useEmployeeAdvanceHistory.ts` per `data-model.md`: takes
  `employeeId: string`; on mount, calls `employeeService.listSalaryAdvances(employeeId)`; on
  success, sorts the result by `advance_date` descending (treat a `null`/missing
  `advance_date` as sorting last) and stores it; computes `total` as the sum of
  `Number(advance.amount)` across the sorted list; exposes `advances: SalaryAdvance[]`
  (default `[]`), `total: number` (default `0`), `loading: boolean`, `error: boolean`, and
  `reload: () => Promise<void>` (re-runs the same fetch, for the modal's retry button) —
  follow the `useEmployeeSchedule.ts` / `useEmployeePaychecks.ts` conventions for
  `useState`/`useCallback`/`useEffect` structure (depends on T001)
- [X] T003 [US1] Create `src/components/HR/EmployeeAdvanceHistoryModal.tsx`: props
  `employeeId: string`, `employeeName: string`, `onClose: () => void`. Use
  `useEmployeeAdvanceHistory(employeeId)` (T002). Reuse the exact modal shell already
  established in `src/components/Reports.tsx`'s sale-details modal (`fixed inset-0 bg-black
  bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto`
  overlay; `bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-none sm:max-h-[90vh]
  overflow-hidden flex flex-col my-auto` card; header row with `employeeName` as the title, an
  `X` icon close button calling `onClose`; scrollable body `overflow-y-auto flex-1`). Body
  content: while `loading`, a "Carregando..." message; if `error`, an error message with a
  "Tentar novamente" button calling `reload()` (same pattern as `SalaryTab.tsx`'s existing
  error state); otherwise, if `advances.length === 0`, "Nenhum adiantamento registrado"; else a
  list of advances (date formatted `pt-BR`, amount as `R$ X.XX`, note shown if present — reuse
  the exact rendering already used for individual advance rows in
  `EmployeePaycheckDetail.tsx`) followed by a totals line showing `total` formatted as
  `R$ X.XX`. This view is read-only — no delete/edit affordance on any entry (spec FR-008)
  (depends on T002)
- [X] T004 [US1] In `src/components/HR/EmployeePaycheckDetail.tsx`, add a new
  `onViewHistory: () => void` prop, and render a small text-button ("Ver histórico completo")
  below the existing period-scoped advances list inside the "Adiantamentos do período"
  section, calling `onViewHistory` on click — this section's existing content and behavior
  (period-scoped list, delete-advance) is otherwise unchanged
- [X] T005 [US1] In `src/components/HR/EmployeePaycheckRow.tsx`, add an `onViewHistory: ()
  => void` prop and pass it straight through to `EmployeePaycheckDetail` alongside the
  existing props (depends on T004)
- [X] T006 [US1] In `src/components/HR/SalaryTab.tsx`, add
  `const [historyEmployee, setHistoryEmployee] = useState<{ id: string; name: string } |
  null>(null)`; pass `onViewHistory={() => setHistoryEmployee({ id: paycheck.employee_id,
  name: paycheck.employee_name })}` to each `EmployeePaycheckRow`; render
  `{historyEmployee && <EmployeeAdvanceHistoryModal employeeId={historyEmployee.id}
  employeeName={historyEmployee.name} onClose={() => setHistoryEmployee(null)} />}` after the
  existing table markup (depends on T003, T005)

**Checkpoint**: User Story 1 is fully functional and independently testable — HR can open,
from any employee's expanded row, a read-only view of that employee's complete advance
history with correct ordering and total, and close it back to an unchanged Salário tab.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation once the story is complete.

- [X] T007 Run `npm run lint` and `npm run typecheck` and fix any issues surfaced across the
  new/changed files
- [X] T008 [P] (Optional, not required by the constitution for a new hook) Add
  `src/hooks/useEmployeeAdvanceHistory.test.ts` covering: fetch-and-sort-descending on mount,
  `total` computed correctly, `error` set on a rejected fetch, and `reload()` re-running the
  fetch — following the `vi.mock('../services/employeeService')` + `renderHook` conventions
  already used in `src/hooks/useEmployeePaychecks.test.ts`
- [X] T009 Execute the manual validation scenarios in `quickstart.md` — **partially
  completed**: no browser automation was available in this environment, so the visual/UI
  parts of Scenarios A–C (clicking "Ver histórico completo", confirming the modal renders
  correctly, closing it and checking tab state is preserved) were not exercised in a browser.
  Verified instead: `npm run build` succeeds; the dev server and the local backend are both
  reachable; the exact API call the new `listSalaryAdvances(employee_id)` service method makes
  (`GET /employees/salary-advances?employee_id=...`, no `month`/`year`) was re-confirmed live
  and its response shape matches `SalaryAdvance` field-for-field (`id, amount, employee_id,
  created_at, note, advance_date`), which is what `useEmployeeAdvanceHistory`'s sort/total
  logic and `EmployeeAdvanceHistoryModal`'s rendering both consume. The all-time-vs-current-
  month scoping behavior itself was already conclusively verified during `/speckit-plan` (see
  `contracts/employee-advance-history.md`). All 5 unit tests for the new hook pass (T008).
  Run the visual scenarios manually in a browser before merging.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — no tasks.
- **Foundational (Phase 2)**: No dependencies beyond the existing codebase — BLOCKS the user
  story.
- **User Story 1 (Phase 3)**: Depends on Foundational (T001) completion.
- **Polish (Phase 4)**: Depends on User Story 1 being complete.

### User Story Dependencies

- **User Story 1 (P1)**: The only story in this feature; no cross-story dependencies.

### Within the User Story

- Hook before the component that consumes it (T002 before T003).
- Leaf prop-threading components before the container that wires them together (T004 before
  T005; T003 and T005 before T006).

### Parallel Opportunities

- T001 (Foundational) has no parallel counterpart — it's the only Foundational task.
- Within User Story 1, T002 and T004 touch different files and have no dependency on each
  other — both only depend on T001 (T002 directly; T004 not at all) — they can be done in
  parallel, but note T003 needs T002 finished and T005 needs T004 finished before either can
  proceed.
- T007 and T008 (Polish) can run in parallel — different files/concerns.

---

## Parallel Example: User Story 1

```bash
# T002 and T004 touch different files and have no dependency on each other:
Task: "Create useEmployeeAdvanceHistory.ts hook in src/hooks/"
Task: "Add Ver histórico completo entry point + onViewHistory prop to EmployeePaycheckDetail.tsx"
```

---

## Implementation Strategy

### MVP First (and Only) Story

1. Complete Phase 2: Foundational (T001).
2. Complete Phase 3: User Story 1 (T002–T006).
3. **STOP and VALIDATE**: Run `quickstart.md` Scenario A end-to-end (an employee with
   advances in more than one month).
4. This delivers the entire feature — there is no further incremental story to add.

### Incremental Delivery

1. Foundational → the complete-history endpoint is callable through the service layer.
2. + User Story 1 → the full feature: HR can open, from the Salário tab, a read-only complete
   advance history for any employee → feature-complete, matches spec fully.
3. + Polish → lint/typecheck clean, optional hook test, full quickstart pass.

### Notes

- [P] tasks = different files, no unmet dependencies.
- [Story] label maps each task to its (single) user story for traceability back to `spec.md`.
- No task modifies `specs/api/employees.md` — the endpoint this feature needs already exists
  and was directly verified against the live local backend during planning (see
  `contracts/employee-advance-history.md`), not merely assumed.
- Commit after each task or logical group, per repository convention.
