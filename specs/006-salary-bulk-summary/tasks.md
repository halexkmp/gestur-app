---

description: "Task list for Salary Tab Bulk Data Loading"
---

# Tasks: Salary Tab Bulk Data Loading

**Input**: Design documents from `/specs/006-salary-bulk-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/salary-summary-overview.md, quickstart.md

**Tests**: Not explicitly requested for new coverage in `spec.md`. However,
`src/hooks/useEmployeePaychecks.test.ts` already exists and its 7 tests currently pass,
asserting the exact lazy, per-employee loading behavior this feature replaces. Per the project
constitution ("keep the suite runnable" for an already-tested hook), rewriting this file is
**mandatory**, not optional test-writing — it is split across Phases 3–4 below, one test per
the behavior it exercises.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2) to enable
independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- File paths are exact and relative to the repository root

## Path Conventions

Single existing frontend project (Vite/React SPA) — all paths under `src/`, per `plan.md`'s
Project Structure.

---

## Phase 1: Setup

**Purpose**: No project initialization needed — existing, already-configured app, no new
dependencies (confirmed in `research.md`: reuses the existing `api.ts` wrapper and the
`schedule-overview` bulk-endpoint convention). Nothing to do here; proceed to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared types and the service method every user story's hook rewrite depends
on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] In `src/types/employee.ts`, per `data-model.md` (now reflecting the confirmed
  `specs/api/employees.md` contract), add three types: `SalarySummaryOverviewAdvance` (`id:
  string; amount: number | string; advance_date?: string | null; note?: string | null` —
  **narrower** than `SalaryAdvance`: deliberately no `employee_id`, `created_at`, or `times`);
  `SalarySummaryOverviewItem` (today's `SalarySummaryResponse` fields — `employee_id, month,
  year, gross_salary, advances_total, late_delay_minutes, late_days_count,
  late_deduction_total, net_salary` — plus `advances: SalarySummaryOverviewAdvance[]`); and
  `SalarySummaryOverviewResponse` (`{ items: SalarySummaryOverviewItem[] }`), mirroring
  `ScheduleOverviewItem`/`ScheduleOverviewResponse`'s style in the same file. Add an optional
  `advances?: SalarySummaryOverviewAdvance[]` field to the existing `EmployeePaycheck`
  interface (**not** `SalaryAdvance[]`). Update the stale doc comment above `EmployeePaycheck`
  (it currently says summary fields are "only populated once the row has been expanded") to
  describe the new bulk-eager-load behavior. No changes needed to `src/types/index.ts` since
  it already does `export * from './employee'`
- [X] T002 In `src/services/employeeService.ts`, add
  `getSalarySummaryOverview: (params?: { month?: number; year?: number }) =>
  api.get<SalarySummaryOverviewResponse>('/employees/salary-summary', { params })` — note the
  path is `/employees/salary-summary` (**no** `-overview` suffix, no path param; the old
  `{employee_id}` form was removed by the backend, it did not gain a sibling route) — placed
  next to the existing "Salary Summary report (per employee)" section and mirroring
  `getScheduleOverview`'s comment style to note it consolidates the per-employee
  summary+advances calls below it (depends on T001)

**Checkpoint**: Foundation ready — the bulk endpoint is callable through the service layer;
user story implementation can now begin.

---

## Phase 3: User Story 1 - See every employee's salary summary at once (Priority: P1) 🎯 MVP

**Goal**: Every active employee's gross salary, advances total, lateness deduction, and net
salary for the selected month/year are populated on the Salário tab without expanding any
row, and refresh automatically when the month or year filter changes.

**Independent Test**: Select a month/year on the Salário tab and confirm every active
employee's row already shows full summary figures — no row still showing only the base
salary placeholder — with no additional network request fired when a row is expanded.

### Implementation for User Story 1

- [X] T003 [US1] In `src/hooks/useEmployeePaychecks.ts`, rewrite `fetchPaychecks` as a
  `useCallback` depending on `[month, year]`: call
  `Promise.all([employeeService.getAll(), employeeService.getSalarySummaryOverview({ month, year })])`,
  build a `Map<string, SalarySummaryOverviewItem>` from `overview.items` keyed by
  `employee_id` (`overview.items` includes inactive employees too — the map itself doesn't
  need to filter them out, since the next step only looks up matches for already-active
  employees), then map each active employee (from `employees.filter(e => e.active)`, as
  today) to an `EmployeePaycheck` that spreads in the matching item's `month, year,
  gross_salary, advances_total, late_delay_minutes, late_days_count, late_deduction_total,
  net_salary` when a match exists (leave those fields `undefined` otherwise, so the row falls
  back to showing `base_salary`, same as today's "not yet loaded" state) (depends on T001,
  T002)
- [X] T004 [US1] In `src/hooks/useEmployeePaychecks.ts`, remove `refreshEmployee` and its
  `loadSummaryForEmployee` alias entirely (superseded by T003's eager bulk load), and in
  `src/components/HR/SalaryTab.tsx`'s `toggleRow`, remove the
  `if (paycheck && paycheck.gross_salary === undefined) { loadSummaryForEmployee(employeeId); }`
  branch — every row's summary is already populated by the time a row can be expanded (depends
  on T003)
- [X] T005 [US1] In `src/hooks/useEmployeePaychecks.ts`, remove the standalone
  `useEffect(() => { setAdvancesByEmployee({}); setPaychecks(...) }, [month, year])` added in
  the prior period-change bugfix — the `setPaychecks` reset is now redundant since `fetchPaychecks`
  (T003) already depends on `[month, year]` and fully replaces `paychecks` on every period
  change; leave the `setAdvancesByEmployee({})` cache-clear in place for now (advances remain
  lazily loaded until User Story 2) by moving just that one line into the top of
  `fetchPaychecks` (depends on T003)
- [X] T006 [US1] In `src/components/HR/SalaryTab.tsx`, remove the
  `loadSummaryForEmployee(expandedEmployeeId)` call from the period-change `useEffect` (keep
  the `loadAdvancesForEmployee(expandedEmployeeId)` call for now, per T005's note) — summary
  data no longer needs a manual re-fetch after a period change (depends on T004)
- [X] T007 [US1] Rewrite `src/hooks/useEmployeePaychecks.test.ts`'s first three tests to match
  the new eager bulk behavior: (a) rename/rewrite "should fetch only active employees on
  mount, without any salary summary requests" to mock both `employeeService.getAll` and
  `employeeService.getSalarySummaryOverview`, and assert the latter **is** called once with
  `{ month, year }` defaults and that `result.current.paychecks[0]` already includes the
  merged summary fields (not just `base_salary`); (b) update "should set error and clear
  paychecks when a fetch fails" to also mock `getSalarySummaryOverview` (resolved or
  irrelevant) alongside the rejected `getAll`, keeping the same error/empty-paychecks
  assertions; (c) invert "should not refetch employees when month or year changes" to "should
  refetch when month or year changes" — after `act(() => result.current.setMonth(6))`, assert
  `employeeService.getAll` and `employeeService.getSalarySummaryOverview` are each called a
  second time (depends on T003, T004, T005)
- [X] T008 [US1] Delete the fourth test in `src/hooks/useEmployeePaychecks.test.ts`
  ("loadSummaryForEmployee should fetch and merge the summary for a single employee only when
  called" — the function it tests no longer exists per T004) and replace it with a test
  asserting that immediately after the initial load resolves, `result.current.paychecks[0]`
  already has `gross_salary`/`net_salary`/etc. populated from a mocked
  `getSalarySummaryOverview` response, with no further hook call required (depends on T004,
  T007)

**Checkpoint**: User Story 1 is fully functional and independently testable — summary figures
for every active employee appear without expanding any row, and update automatically when the
period changes. `useEmployeePaychecks.test.ts`'s summary-related tests pass again.

---

## Phase 4: User Story 2 - See an employee's advances without a separate wait (Priority: P2)

**Goal**: Expanding any employee's row shows their salary advances for the selected period
immediately (embedded in the same bulk data as the summary), with no separate loading state;
creating or deleting an advance updates the tab without a manual reload.

**Independent Test**: Expand the row of an employee with advances and one with none; confirm
both show their correct advances state immediately with no separate spinner. Create then
delete an advance and confirm the totals and list update without reloading the page.

### Implementation for User Story 2

- [X] T009 [US2] In `src/hooks/useEmployeePaychecks.ts`, extend the merge added in T003 to also
  copy each matched overview item's `advances` array (type `SalarySummaryOverviewAdvance[]`)
  onto the corresponding `EmployeePaycheck.advances` field (depends on T003)
- [X] T010 [US2] In `src/hooks/useEmployeePaychecks.ts`, remove the `advancesByEmployee` state,
  the `getAdvancesForEmployee` accessor, and `loadAdvancesForEmployee` entirely (superseded by
  T009's embedded data), and remove the `setAdvancesByEmployee({})` line moved into
  `fetchPaychecks` in T005 (depends on T005, T009)
- [X] T011 [US2] In `src/hooks/useEmployeePaychecks.ts`, change `createAdvance` and
  `deleteAdvance` to `await fetchPaychecks()` after their respective
  `employeeService.createSalaryAdvance` / `deleteSalaryAdvance` call succeeds, replacing the
  removed `refreshEmployee`/`loadAdvancesForEmployee` targeted calls (depends on T004, T010)
- [X] T012 [US2] In `src/components/HR/SalaryTab.tsx`, remove the now-empty period-change
  `useEffect` left over after T006 (its only remaining call, `loadAdvancesForEmployee`, no
  longer exists per T010 — period changes already refresh everything via `fetchPaychecks`),
  and simplify `toggleRow` to only call `setExpandedEmployeeId`, with no conditional fetch
  calls at all (depends on T006, T010, T011)
- [X] T013 [US2] Wire the embedded advances through, accounting for their narrower type
  (no `employee_id` on each advance — see `data-model.md`):
  - In `src/components/HR/EmployeePaycheckRow.tsx` and
    `src/components/HR/EmployeePaycheckDetail.tsx`, change the `advances` prop type from
    `SalaryAdvance[] | undefined` to `SalarySummaryOverviewAdvance[] | undefined`, and the
    `onDeleteAdvance` prop type from `(advance: SalaryAdvance) => void` to
    `(advance: SalarySummaryOverviewAdvance) => void` (type-only change; both components
    already just read `.id`, `.amount`, `.advance_date`, `.note` off each advance, all present
    on the narrower type)
  - In `src/components/HR/SalaryTab.tsx`, pass `advances={paycheck.advances}` directly to
    `EmployeePaycheckRow` instead of `getAdvancesForEmployee(paycheck.employee_id)`
  - In `src/components/HR/SalaryTab.tsx`, change `handleDeleteAdvance`'s signature from
    `(advance: SalaryAdvance) => ...` to `(employeeId: string, advance:
    SalarySummaryOverviewAdvance) => ...`, calling `deleteAdvance(advance.id, employeeId)`
    instead of `deleteAdvance(advance.id, advance.employee_id)` (the embedded advance has no
    `employee_id` to read); update the `onDeleteAdvance` prop passed to each
    `EmployeePaycheckRow` to close over that row's own employee id, e.g.
    `onDeleteAdvance={(advance) => handleDeleteAdvance(paycheck.employee_id, advance)}`
  (depends on T010)
- [X] T014 [US2] Delete the fifth test in `src/hooks/useEmployeePaychecks.test.ts`
  ("getAdvancesForEmployee should return undefined until loadAdvancesForEmployee resolves,
  then the list" — both functions it tests no longer exist per T010) and replace it with a
  test asserting that immediately after the initial load resolves, `result.current.
  paychecks[0].advances` already equals the list from a mocked `getSalarySummaryOverview`
  response item, with no further hook call required (depends on T009, T010)
- [X] T015 [US2] Rewrite the last two tests in `src/hooks/useEmployeePaychecks.test.ts`
  ("createAdvance should call the service then refresh that employee summary and advances",
  "deleteAdvance should call the service then refresh...") to mock
  `employeeService.getSalarySummaryOverview` (not `getSalarySummary`/`listSalaryAdvances`) and
  assert it is called a second time (alongside `getAll`) after `createAdvance`/`deleteAdvance`
  resolves, instead of asserting the removed per-employee calls (depends on T011)

**Checkpoint**: Both user stories are independently functional — summaries and advances both
arrive eagerly in one bulk load, mutations refresh via one re-fetch, and
`useEmployeePaychecks.test.ts`'s full suite passes again against the new implementation.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation once both stories are complete.

- [X] T016 [P] In `src/services/employeeService.ts`, remove `getSalarySummary` (per-employee)
  and `listSalaryAdvances` — after T003/T009 they have no remaining caller anywhere in `src/`
  (confirm with `grep -rn "listSalaryAdvances\|getSalarySummary\b" src/` before deleting; the
  self-service `getMySalarySummary`/`getMySalaryAdvances` methods are separate and unaffected)
- [X] T017 Run `npm run lint` and `npm run typecheck` and fix any issues surfaced across the
  new/changed files
- [X] T018 Run `npx vitest run src/hooks/useEmployeePaychecks.test.ts` and confirm all 7 tests
  (as rewritten across T007, T008, T014, T015) pass
- [X] T019 Execute the manual validation scenarios in `quickstart.md` — **partially
  completed**: no browser automation was available in this environment, so the UI-level
  checks in Scenarios A–D (rows showing data without expanding, no visible loading spinners,
  filter behavior) were not visually exercised. Verified instead against the live local
  backend (`localhost:8000`, real data, admin-authenticated):
  - `GET /employees/salary-summary`'s live OpenAPI schema and an authenticated live response
    match `SalarySummaryOverviewItem`/`SalarySummaryOverviewAdvance` exactly, field-for-field
    — including the narrower embedded advance shape (`id, amount, advance_date, note`, no
    `employee_id`/`created_at`) that motivated the T013 fix.
  - Full create → verify-embedded → delete round trip performed via direct API calls against
    a real employee: `POST /employees/salary-advances` → confirmed the new advance appeared
    embedded under that employee with correct `advances_total` → `DELETE
    /employees/salary-advances/{id}` using **only the advance's own id** (no `employee_id`)
    succeeded (204) and the advance was gone with `advances_total` recalculated correctly —
    directly validating `deleteAdvance(advanceId)`'s signature and the fixed
    `handleDeleteAdvance` call site.
  - `npm run build` succeeds; `npm run dev` serves without startup errors.
  - Scenario C (period/employee filter) and the visual aspects of Scenarios A/B/D are covered
    by the rewritten unit tests (T007's month/year refetch test, T008/T014's no-extra-call
    assertions) but not by an actual browser session — run those manually before merging if a
    browser is available.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — no tasks.
- **Foundational (Phase 2)**: No dependencies beyond the existing codebase — BLOCKS all user
  stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (T001–T002) completion. No dependency on
  US2.
- **User Story 2 (Phase 4)**: Depends on Foundational completion **and** on User Story 1's
  `fetchPaychecks` rewrite (T003) and its test updates (T004–T008) existing to extend, since
  both stories are delivered by evolving the same function and the same test file rather than
  two independent files. Implement after US1.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable after Foundational — no dependency on US2.
  Ships value on its own: summary figures load eagerly even while advances are still fetched
  lazily on row expand (unchanged old behavior for advances only).
- **User Story 2 (P2)**: Builds directly on US1's bulk-fetch scaffolding (T003) to also carry
  advances, and on US1's removal of the summary lazy-loader (T004) before removing the
  advances lazy-loader — cannot be implemented first or in true isolation from US1, unlike the
  fully-independent story pairs in other features in this repo. Independently *verifiable*
  once done (advances-specific acceptance scenarios), even though not independently
  *implementable* before US1.

### Within Each User Story

- Hook rewrite before component simplification (e.g., T003 before T004; T009 before T010).
- Hook changes before their corresponding test rewrites (T003–T006 before T007–T008; T009–T011
  before T014–T015).
- Story complete (checkpoint) before moving to the next priority.

### Parallel Opportunities

- T001 and T002 (Foundational) are listed with T001 as `[P]`, but T002 imports the type T001
  adds, so in practice do T001 first; they are not truly parallel-safe despite touching
  different files.
- Within Phase 3, T007 and T008 both edit the same test file sequentially — not parallelizable
  with each other, but the whole pair only starts once T003–T006 are done.
- T016 (Polish) can run in parallel with T017/T018 prep — different file — but should still
  run only after T009/T011 confirm no remaining callers.

---

## Parallel Example: Foundational

```bash
# T001 must land before T002 (T002 imports SalarySummaryOverviewResponse), so in practice
# run them sequentially despite touching different files:
Task: "Add SalarySummaryOverviewAdvance/SalarySummaryOverviewItem/SalarySummaryOverviewResponse types to src/types/employee.ts"
Task: "Add getSalarySummaryOverview (GET /employees/salary-summary) to src/services/employeeService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001–T002).
2. Complete Phase 3: User Story 1 (T003–T008).
3. **STOP and VALIDATE**: Run `quickstart.md` Scenario A, plus
   `npx vitest run src/hooks/useEmployeePaychecks.test.ts` and manual confirmation that
   advances still lazy-load correctly on row expand (unchanged behavior at this point).
4. This alone delivers the headline value (no more expanding every row to see pay figures)
   even before advances are folded into the same bulk load.

### Incremental Delivery

1. Foundational → bulk endpoint callable through the service layer, nothing wired yet.
2. + User Story 1 → summary figures load eagerly for everyone; advances still lazy per row →
   demo-able MVP.
3. + User Story 2 → advances also arrive eagerly, mutations refresh via one bulk re-fetch,
   dead lazy-loading code removed → feature-complete, matches spec fully.
4. + Polish → dead per-employee service methods removed, lint/typecheck/test clean, full
   quickstart pass.

### Notes

- [P] tasks = different files, no unmet dependencies — but see the Parallel Opportunities
  caveat above; this feature has fewer true parallel opportunities than most because nearly
  every task evolves the same two files (`useEmployeePaychecks.ts` and its test).
- [Story] label maps each task to its user story for traceability back to `spec.md`.
- No task modifies `specs/api/employees.md` — the bulk endpoint this feature needs is already
  confirmed live there ("Salary Summary (All Employees)"); `contracts/salary-summary-overview.md`
  summarizes the parts relevant to these tasks. Two corrections surfaced once the real
  contract was confirmed (folded into T001/T002/T003/T013 above): the endpoint path is
  `/employees/salary-summary`, not a new `-overview`-suffixed route; and the embedded
  `advances` shape is narrower than the standalone `SalaryAdvance` type, requiring the
  delete-advance fix in T013.
- Commit after each task or logical group, per repository convention.
