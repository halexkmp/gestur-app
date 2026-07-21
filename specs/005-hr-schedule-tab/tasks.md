---

description: "Task list for HR Work Schedule Tab (Escala de Trabalho)"
---

# Tasks: HR Work Schedule Tab (Escala de Trabalho)

**Input**: Design documents from `/specs/005-hr-schedule-tab/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/api-error-status.md, contracts/use-employee-schedule-hook.md,
contracts/use-work-schedule-hook.md, quickstart.md

**Tests**: Not explicitly requested in spec.md — no TDD/contract-test tasks are included per
user story. One exception: `plan.md`/`research.md` mandate `src/lib/api.test.ts` because the
`lib/api.ts` change is a shared, previously-untested, foundational file every service depends
on — included as a Foundational-phase task (T003), not optional Polish, since it guards the
mechanism every other task in this feature relies on.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2/P3) to enable
independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact and relative to the repository root

## Path Conventions

Single existing frontend project (Vite/React SPA) — all paths under `src/`, per `plan.md`'s
Project Structure.

---

## Phase 1: Setup

**Purpose**: No project initialization needed — existing, already-configured app, no new
dependencies (confirmed in `research.md`: no calendar library is introduced). Nothing to do
here; proceed to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared types, the API-client fix that makes "no schedule" detectable, the
schedule read/write service methods, and the tab-shell wiring every user story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Add all new backend-shape and view-model types to `src/types/employee.ts` per
  `data-model.md`: `EmployeeWeeklySchedule`, `UpdateEmployeeWeeklyScheduleRequest`,
  `JustifiedAbsence`, `CreateJustifiedAbsenceRequest`, `AttendanceDayStatus` (union:
  `'PRESENT' | 'JUSTIFIED_ABSENCE' | 'UNJUSTIFIED_ABSENCE'`), `AttendanceDay`,
  `AttendanceVerificationResponse`, `CalendarCellState` (union: `'WORKED' | 'JUSTIFIED_ABSENCE'
  | 'UNJUSTIFIED_ABSENCE' | 'NOT_SCHEDULED' | 'NO_DATA'`), `CalendarDayCell` (`date`, `state`,
  optional `detail` — no id field; see `data-model.md`), `EmployeeScheduleRow`; no changes
  needed to `src/types/index.ts` since it already does `export * from './employee'`
- [X] T002 [P] Extend `src/lib/api.ts` per `contracts/api-error-status.md`: export a new
  `ApiError extends Error` class with a `status: number` field, throw it (instead of a plain
  `Error`) from `request<T>`'s existing non-2xx/non-401/non-204 branch, setting `status` to
  `response.status`; keep the existing `.message` (`detail`-or-fallback) behavior and the 401/204
  special cases unchanged
- [X] T003 Create `src/lib/api.test.ts` per `contracts/api-error-status.md`'s Test coverage
  section: a non-2xx response with a `detail` body throws `ApiError` with matching `.message`
  and `.status`; a non-2xx response with an unparsable body throws `ApiError` with the fallback
  message and correct `.status`; a 204 response still resolves to `{}`; a 401 response still
  clears `localStorage.auth_token` and redirects (depends on T002)
- [X] T004 Add `getSchedule` and `updateSchedule` methods to `src/services/employeeService.ts`:
  `getSchedule(employee_id)` calls `GET /employees/schedule/{employee_id}`, catches `ApiError`
  with `status === 404` and resolves to `null`, rethrows any other error; `updateSchedule(employee_id,
  payload)` calls `PUT /employees/schedule/{employee_id}` with an
  `UpdateEmployeeWeeklyScheduleRequest` body, returning the updated `EmployeeWeeklySchedule`
  (depends on T001, T002)
- [X] T005 [P] Create placeholder `src/components/HR/ScheduleTab.tsx` — a prop-less, default-exported
  component (matching the `SalaryTab.tsx`/`JourneyTab.tsx` self-contained-via-own-hooks
  convention) rendering only a heading ("Escala de Trabalho") and a TODO container for now
  (filled in by User Story 2)
- [X] T006 Wire `src/components/HR.tsx`: add a `'schedule'` tab id between `'journey'` and
  `'lateness'` in both the `activeTab` union type and the tab bar (label "Escala de Trabalho",
  a `CalendarDays` icon from `lucide-react` — distinct from the `Users`/`Banknote`/`MapPin`/
  `Clock` icons already used by the other tabs), rendering `<ScheduleTab />` (from T005) when
  `activeTab === 'schedule'` (depends on T005)

**Checkpoint**: Foundation ready — schedule reads/writes are wired through the service layer,
"no schedule" is reliably detectable, and the tab exists (currently empty); user story
implementation can now begin.

---

## Phase 3: User Story 1 - Configure an employee's weekly work schedule (Priority: P1) 🎯 MVP

**Goal**: From the employee create/edit form, HR can set which weekdays an employee is
expected to work, and the selection persists and reloads correctly, including the
distinction between "never configured" and "configured with zero days."

**Independent Test**: Edit an employee, switch on schedule configuration, select
Monday–Friday, save, reopen the form and confirm Monday–Friday show as checked; change the
selection and confirm it fully replaces the previous one; leave a new employee's schedule
untouched and confirm no schedule call is made (reopening still shows "not configured").

### Implementation for User Story 1

- [X] T007 [US1] Create `src/hooks/useEmployeeSchedule.ts` per
  `contracts/use-employee-schedule-hook.md`: takes `employeeId: string | null`, exposes
  `schedule: EmployeeWeeklySchedule | null`, `isConfigured: boolean`, `loading`, `error`,
  `load()` (no-op when `employeeId` is `null`; sets `schedule: null`/`isConfigured: false` with
  no `error` on a 404 from `employeeService.getSchedule`, sets `error` on any other failure),
  and `save(days)` (calls `employeeService.updateSchedule`, always sending all seven flags,
  updates local `schedule`/`isConfigured` on success) (depends on T004)
- [X] T008 [US1] Extend `src/components/EmployeeFormModal.tsx`: add a schedule section using
  `useEmployeeSchedule(employee?.id ?? null)` — on open for an existing employee, call `load()`
  and render either the seven day checkboxes pre-filled (if `isConfigured`) or a "Configurar
  escala de trabalho" toggle that reveals seven unchecked day checkboxes when switched on (if
  not `isConfigured`), mirroring the existing three-way account-link toggle pattern already in
  this file; on submit, call `save(days)` only if the section is/was in its "configured" state
  (never call it for an untouched "not configured" section); for a brand-new employee, sequence
  the schedule `save()` call *after* `employeeService.create()` resolves with the new
  employee's id, matching the existing pattern where user-account creation is likewise
  sequenced after the employee id is known (depends on T007)

**Checkpoint**: User Story 1 is fully functional and independently testable — HR can configure
and persist an employee's weekly work schedule from the existing CRUD form.

---

## Phase 4: User Story 2 - View the team's work schedule calendar (Priority: P2)

**Goal**: Opening the "Escala de Trabalho" tab shows, for a selected month, every active
employee's day-by-day status (worked / justified absence / unjustified absence / not
scheduled / no data), as a scannable roster grid by default and a literal month calendar when
narrowed to one employee.

**Independent Test**: Open the tab for a month where at least one employee has a configured
schedule; confirm each day cell reflects the correct status per `data-model.md`'s derivation
rules (including no-schedule, no-linked-account, and inactive employees rendering as "no
data," not absences); navigate months and confirm the grid reloads; narrow to one employee and
confirm the view switches to a month calendar. No action buttons are required yet (read-only).

### Implementation for User Story 2

- [X] T009 [US2] Add `getAttendanceVerification` to `src/services/employeeService.ts`: calls
  `GET /employees/attendance-verification/{employee_id}?month&year`, returning an
  `AttendanceVerificationResponse` (depends on T001)
- [X] T010 [P] [US2] Create `src/components/HR/scheduleCellVisual.ts` exporting
  `getCellVisual(state: CalendarCellState): { className: string; icon: LucideIcon | null; label: string }`
  implementing the color+icon pairing from `research.md` (worked=green+check, justified
  absence=slate/blue+document icon, unjustified absence=red+alert icon, not scheduled=muted
  gray no icon, no data=hatched/dashed muted); this is the single source of truth both
  `ScheduleGrid.tsx` and `ScheduleMonthCalendar.tsx` import, so the two views can never render
  the same state two different ways (depends on T001 for the `CalendarCellState` type)
- [X] T011 [US2] Create `src/hooks/useWorkSchedule.ts` per
  `contracts/use-work-schedule-hook.md` (load-only for this story; mutations added in US3):
  `month`/`year` state (default current month/year) with `setMonth`/`setYear`; on mount and on
  `month`/`year` change, fetch `GET /employees/?active=true`, then per employee in parallel
  fetch `employeeService.getAttendanceVerification` (always) and, conditionally,
  `employeeService.getSchedule` (only for an employee that is active, has a linked `user_id`,
  and whose `days[]` came back empty — see `data-model.md`'s employee-level derivation pass);
  compose each employee's data into one `EmployeeScheduleRow` per `data-model.md`'s derivation
  rules; expose `rows`, `loading`, `error`. Does **not** call `listJustifiedAbsences` — that's
  wired in User Story 3's T016, entirely independent of this task (depends on T004, T009)
- [X] T012 [P] [US2] Create `src/components/HR/ScheduleGrid.tsx`: roster grid with one row per
  `EmployeeScheduleRow` (sticky/pinned employee-name column) and one column per day of the
  displayed month; render each `CalendarDayCell` using `getCellVisual` (T010) for its
  className/icon, with a `title`/tooltip showing `detail`; horizontally scrollable container so
  long months don't break layout on narrow viewports (depends on T010)
- [X] T013 [P] [US2] Create `src/components/HR/ScheduleMonthCalendar.tsx`: traditional
  Monday–Sunday, week-row month calendar for a single `EmployeeScheduleRow`, using the same
  `getCellVisual` helper (T010) as `ScheduleGrid.tsx` for day cells, with days outside the
  displayed month left blank/muted (depends on T010)
- [X] T014 [US2] Wire `src/components/HR/ScheduleTab.tsx`: month/year navigation controls
  (reuse the pt-BR month-name pattern already used in `EmployeeSalarySummary.tsx`/
  `SalaryTab.tsx`), an employee filter (a "Todos" option plus one entry per active employee,
  matching the `<select>` pattern in `JourneyTab.tsx`), a status legend (color+icon key for
  all five `CalendarCellState` values, reusing `getCellVisual` from T010), a loading state and
  an error state with retry, and conditional rendering of `ScheduleGrid` (T012, no employee
  selected) or `ScheduleMonthCalendar` (T013, one employee selected), fed by
  `useWorkSchedule()` (T011) (depends on T011, T012, T013)

**Checkpoint**: User Stories 1 AND 2 both work independently — schedules can be configured and
the calendar correctly reflects them, read-only. Unlike the original design, US2 has zero
dependency on any User Story 3 task or service method.

---

## Phase 5: User Story 3 - Justify an absence directly from the calendar (Priority: P3)

**Goal**: HR can justify an unjustified-absence day (with an optional reason) or remove an
existing justification, directly from the calendar, without leaving the tab.

**Independent Test**: Click an unjustified-absence cell, enter a reason, confirm, and observe
the same cell now shows "justified absence"; attempt to justify an already-justified day or a
non-scheduled day and confirm the action isn't offered or is rejected with a clear message;
remove a justification and confirm the cell reverts to its actual status.

### Implementation for User Story 3

- [X] T015 [US3] Add `listJustifiedAbsences`, `createJustifiedAbsence`, and
  `deleteJustifiedAbsence` to `src/services/employeeService.ts`: `listJustifiedAbsences(params)`
  calls `GET /employees/justified-absences?employee_id&month&year`; `createJustifiedAbsence(payload)`
  calls `POST /employees/justified-absences` (`201`, no body — resolves to `void`);
  `deleteJustifiedAbsence(id)` calls `DELETE /employees/justified-absences/{id}` (depends on T001)
- [X] T016 [US3] Extend `src/hooks/useWorkSchedule.ts` with `justifyAbsence(employeeId, date, reason?)`
  (calls `employeeService.createJustifiedAbsence`, surfaces the thrown `Error.message` inline
  rather than a generic failure, and on success re-fetches only that employee's
  attendance-verification and updates their row) and `removeJustification(employeeId, date)`
  (calls `employeeService.listJustifiedAbsences({ employee_id, month, year })` fresh at call
  time to find the record matching `date`, surfaces an inline "not found" message if no match
  exists, otherwise calls `employeeService.deleteJustifiedAbsence` with that record's `id` and
  re-fetches that employee's attendance-verification) per `contracts/use-work-schedule-hook.md`
  (depends on T011, T015)
- [X] T017 [P] [US3] Create `src/components/HR/JustifyAbsenceModal.tsx`: a small modal with two
  modes — "justify" (optional reason field, confirm button, calls `justifyAbsence(employeeId, date, reason)`)
  and "remove" (confirmation only, calls `removeJustification(employeeId, date)`) — surfacing
  any thrown/returned error message inline (e.g. duplicate justification, non-scheduled day,
  record not found) rather than a generic alert
- [X] T018 [US3] In `src/components/HR/ScheduleGrid.tsx` and
  `src/components/HR/ScheduleMonthCalendar.tsx`, add click handling only to
  `UNJUSTIFIED_ABSENCE` cells (opens `JustifyAbsenceModal` in "justify" mode, passing
  `employeeId`/`date`) and `JUSTIFIED_ABSENCE` cells (opens it in "remove" mode, same
  `employeeId`/`date` pair — no id needed at this point); give these cells a pointer cursor and
  hover highlight; leave `WORKED`/`NOT_SCHEDULED`/`NO_DATA` cells inert (no cursor change, no
  click handler), per `research.md`'s "only actionable cells respond to interaction" decision
  (depends on T012, T013, T016, T017)

**Checkpoint**: All three user stories are independently functional — the calendar is fully
interactive, matching the spec end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation once all desired stories are complete.

- [X] T019 [P] Remove any now-unused imports left in `src/components/HR.tsx` after the T006
  tab-wiring change
- [X] T020 Run `npm run lint` and `npm run typecheck` and fix any issues surfaced across the
  new/changed files
- [X] T021 [P] Add `src/hooks/useWorkSchedule.test.ts` covering the `CalendarCellState`
  derivation rules from `data-model.md` (no-schedule, no-linked-account, inactive, before-hire,
  day-off, worked, justified, unjustified — including the conditional-schedule-fetch branch and
  the not-yet-hired short-circuit) and the `justifyAbsence`/`removeJustification`
  partial-refresh behavior (including `removeJustification`'s not-found path), following the
  `vi.mock('../services/employeeService')` + `renderHook` conventions in
  `src/hooks/useLoans.test.ts` — recommended given the derivation logic's complexity, though
  not mandated by the constitution's testing gate (new hook, not an edit to an already-tested
  one)
- [ ] T022 Execute the manual validation scenarios in `quickstart.md` (all 12 scenarios,
  including the non-interactive-cell check and the roster-vs-calendar view switch) against a
  running `npm run dev` instance — **not completed**: `VITE_API_URL` (`localhost:3000`) has no
  reachable backend in this environment, so no live login/data was available to exercise the
  12 scenarios end-to-end. Verified instead: `npm run build` succeeds, `npm run dev` serves the
  app with no startup errors (HTTP 200, no console errors), and the full Vitest suite (35/35,
  including the 11 new `useWorkSchedule` derivation/mutation tests) passes. Run the 12
  quickstart scenarios against a live backend before merging.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — no tasks.
- **Foundational (Phase 2)**: No dependencies beyond the existing codebase — BLOCKS all user
  stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (T001–T006) completion. No dependency on
  US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational completion only. No dependency on User
  Story 3 — `useWorkSchedule` (T011) never calls `listJustifiedAbsences`, so US2 is fully
  self-contained and independently completable/testable before US3 exists at all.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and on US2's `useWorkSchedule`
  (T011), `ScheduleGrid` (T012), and `ScheduleMonthCalendar` (T013) existing to extend/wire
  into. Implement after US2.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independently testable after Foundational — no dependency on US2/US3.
- **User Story 2 (P2)**: Builds on Foundational's schedule service methods; independently
  verifiable (read-only calendar) once its tasks are done — no dependency on US3 in either
  direction.
- **User Story 3 (P3)**: Builds on US2's hook and both calendar components — independently
  verifiable (justify/remove an absence and observe the cell update) once its tasks are done.

### Within Each User Story

- Hook creation/extension before component wiring (e.g., T007 before T008; T011 before T014;
  T016 before T018).
- The shared `scheduleCellVisual.ts` helper (T010) before either component that consumes it
  (T012, T013).
- New leaf components (`ScheduleGrid`, `ScheduleMonthCalendar`, `JustifyAbsenceModal`) before
  the container (`ScheduleTab`) or the click-wiring task that depends on them.
- Story complete (checkpoint) before moving to the next priority.

### Parallel Opportunities

- T001 and T002 (Foundational) can run in parallel — different files, no shared dependency.
- T005 can run in parallel with T001/T002/T003/T004 — different file, no dependency.
- T010 (US2, shared helper) can run in parallel with T009 and T011 — different files; T012/T013
  do need T010 finished first.
- T012 and T013 (US2) can run in parallel — different files, both only depend on T010/T001.
- T015 (US3) can run in parallel with T009/T010/T011/T012/T013 (US2) — different file
  (`employeeService.ts` vs. hooks/components); only T016 and T018 need T015 finished.
- T017 (US3) can run in parallel with T016 — different files (component vs. hook).
- T019 and T021 (Polish) can run in parallel — different files.

---

## Parallel Example: Foundational

```bash
# T001 and T002 touch different files and have no dependency on each other:
Task: "Add new schedule/absence/attendance/calendar types to src/types/employee.ts"
Task: "Extend src/lib/api.ts with ApiError (status code on thrown errors)"
```

## Parallel Example: User Story 2

```bash
# T012 and T013 both only depend on T010's shared helper, and touch different files:
Task: "Create ScheduleGrid.tsx — all-employees roster grid"
Task: "Create ScheduleMonthCalendar.tsx — single-employee month calendar"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001–T006).
2. Complete Phase 3: User Story 1 (T007–T008).
3. **STOP and VALIDATE**: Run `quickstart.md` scenarios 1-3 (configure, replace, leave
   untouched).
4. This alone delivers real value (schedule data starts existing) even before the calendar can
   display it.

### Incremental Delivery

1. Foundational → schedule reads/writes wired, empty "Escala de Trabalho" tab.
2. + User Story 1 → HR can configure schedules → demo-able MVP.
3. + User Story 2 → read-only calendar reflecting those schedules → demo-able.
4. + User Story 3 → justify/remove absences inline → feature-complete, matches spec fully.
5. + Polish → cleanup, hook test, full quickstart pass.

### Notes

- [P] tasks = different files, no unmet dependencies.
- [Story] label maps each task to its user story for traceability back to `spec.md`.
- No task modifies any file under `specs/api/` — the five endpoints this feature needs already
  exist per the contract, confirmed by the `api-contract-check` hook at spec time.
- `src/lib/api.ts` (T002) is the one shared file this feature touches; it is additive only
  (existing `err.message` call sites across the app are unaffected) — see
  `contracts/api-error-status.md`.
- The eager per-employee fetch is deliberately `attendance-verification` always +
  `schedule` only when ambiguous, never `justified-absences` eagerly — see `research.md` for
  why (avoids a `1 + 3E` request cost per month view in favor of `1 + E (+ S)`).
- Commit after each task or logical group, per repository convention.
