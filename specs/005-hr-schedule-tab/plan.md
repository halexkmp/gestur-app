# Implementation Plan: HR Work Schedule Tab (Escala de Trabalho)

**Branch**: `005-hr-schedule-tab` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-hr-schedule-tab/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a new "Escala de Trabalho" tab to the HR page (positioned after Jornadas, before the
existing Configuração de Atrasos settings tab, per the settings-last convention already
established in `specs/004-hr-journey-tab`), showing an interactive, per-employee attendance
calendar for a selected month: worked, justified absence, and unjustified absence (scheduled
with no journey register and no justification) — plus the ability to justify an absence, or
remove a prior justification, directly from the calendar. The employee CRUD (`EmployeeFormModal`)
is extended with a weekly-work-schedule editor so HR can configure which weekdays an employee
is expected to work. Unlike `003`/`004`, this feature is **not** frontend-only: the backend
contract already exposes the five endpoints this needs (Employee Weekly Schedule,
Justified Absence, Attendance Verification — confirmed via the `api-contract-check` hook at
spec time), but the frontend has no types/service/hook wiring for any of them yet, so this
plan adds that wiring in the existing `types/ → services/ → hooks/ → components/` layers.
One cross-cutting gap surfaced during planning: `src/lib/api.ts` currently discards the HTTP
status code on failed requests, but the contract treats `404` on `GET /employees/schedule/{id}`
as a meaningful, distinct state ("no schedule configured") rather than an error — this plan
extends the shared API client minimally (attach `status` to thrown errors) so that state can be
detected reliably instead of via fragile message-string matching.
Per explicit user instruction, the calendar must apply UX best practices and stay easy to use
and clear — addressed via progressive disclosure (roster grid for all employees, a literal
month calendar when one employee is selected), consistent status color+icon coding reused from
existing app conventions (centralized in one shared helper so the grid and the single-employee
calendar can never render the same state two different ways), and restricting interactivity
(click-to-justify) to only the cells where an action is actually possible.
A second cross-cutting concern surfaced during planning: a naive per-employee fetch (schedule +
attendance-verification + justified-absences, all eager, all endpoints) would cost 3 requests
per active employee on every tab open and month change. This plan instead fetches
attendance-verification unconditionally but the schedule only for the narrow case where it's
genuinely needed to disambiguate "no schedule" from "schedule with zero work days," and never
fetches justified-absences eagerly at all — it's resolved lazily, one employee/month, only when
HR opens the remove-justification action (see `research.md`'s fetch-scoping decisions).

## Technical Context

**Language/Version**: TypeScript 5 / React 18 (existing Vite app, no version change)

**Primary Dependencies**: React 18, Tailwind CSS, `lucide-react` (icons) — all already in
`package.json`; no new dependency introduced. No calendar/date library exists in this repo
today (confirmed via `package.json`) and none is added — the grid/calendar is built with plain
Tailwind + native `Date`, consistent with how `JourneyTab.tsx`/`EmployeeFormModal.tsx` already
handle dates.

**Storage**: N/A — frontend-only code change; backend consumed via `VITE_API_URL`. All five
endpoints this feature needs (`GET/PUT /employees/schedule/{id}`, `POST/GET /employees/justified-absences`,
`DELETE /employees/justified-absences/{id}`, `GET /employees/attendance-verification/{id}`)
already exist per `specs/api/employees.md` — no backend changes required.

**Testing**: Vitest + `@testing-library/react`. New hooks (`useEmployeeSchedule`,
`useWorkSchedule`) are new code, not edits to an already-tested hook, so per the constitution's
Development Workflow gate they are not required to ship with tests — but see Constraints below
for the one exception (the `lib/api.ts` change).

**Target Platform**: Web SPA (existing), responsive down to mobile viewport widths per the
rest of the app; the roster grid must remain usable (horizontally scrollable) on narrow screens
rather than breaking layout.

**Project Type**: Single frontend web application (existing repo structure; backend is a
separate, already-deployed service).

**Performance Goals**: No documented backend rate limits, but a naive implementation (schedule +
attendance-verification + justified-absences, all eager, per employee) would cost `1 + 3E`
requests per month view (E = active employee count) — three times the `1 + E` precedent
already accepted in `specs/003-hr-salary-tab/research.md`. This plan instead issues
`1 + E (+ S)` requests: `GET /employees/?active=true` once, `GET /employees/attendance-verification/{id}`
per employee always, and `GET /employees/schedule/{id}` only for the subset `S` of employees
where an empty `days[]` is genuinely ambiguous (active, linked, but unclear whether "no
schedule" or "schedule with zero work days") — `S` is typically small or zero, not `E`.
`GET /employees/justified-absences` is never called eagerly; it's resolved on demand, one
employee/month, only when HR opens the remove-justification action. See `research.md` for the
full rationale and rejected alternatives (including a possible future backend enhancement if
headcount ever outgrows this).

**Constraints**: Must preserve the layered architecture (components/hooks/services/types).
`src/lib/api.ts`'s `request<T>` must be extended to attach the HTTP status code to thrown
errors (see Research decision below) — this is the one shared/cross-cutting file this feature
touches; because it's foundational (every service depends on it) and currently has no test
coverage, this plan adds a focused `src/lib/api.test.ts` covering the new status-code behavior
alongside the existing pass-through behavior, as a guard against regressing every other
service's error handling. New types belong in `types/employee.ts` (re-exported via
`types/index.ts`'s existing `export *`, per Constitution III); new endpoint calls belong only
in `employeeService.ts` (Constitution II); new components follow the existing `components/HR/`
subfolder convention (prop-less, self-contained-via-own-hooks, per `SalaryTab.tsx`/`JourneyTab.tsx`).
**UX Approach** (per explicit request to apply UX best practices, "mainly the interactive
calendar... easy to use and clear"): default to a roster/grid view (rows = employees, columns
= days of the selected month) for scanning many employees at once (spec SC-003 — identify all
unresolved absences within 30 seconds), and switch to a literal 7-column Monday–Sunday month
calendar when HR narrows the view to one employee (spec FR-007) — giving a genuinely
"interactive calendar" experience without sacrificing at-a-glance scannability across a team.
Status is communicated with color **and** icon together (never color alone), reusing the
green/red semantic pairing already used for the Ativo/Inativo badge in `HR.tsx`'s employee
table, so the same colors mean the same thing everywhere in the app. Only actionable cells
(unjustified absence → justify; justified absence → remove) show a pointer cursor and respond
to clicks — every other cell is visually inert, so users never wonder what's clickable.

**Scale/Scope**: One `lib/api.ts` extension, six new `employeeService.ts` methods, ten new
type definitions, two new hooks, one new shared presentation helper (`scheduleCellVisual.ts`),
four new components (`ScheduleTab`, `ScheduleGrid`, `ScheduleMonthCalendar`,
`JustifyAbsenceModal`), one edited component (`EmployeeFormModal`), one edited component
(`HR.tsx`, new tab wiring).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Layered Architecture** — PASS. `ScheduleTab`/`ScheduleGrid`/`ScheduleMonthCalendar`/
  `JustifyAbsenceModal` and the extended `EmployeeFormModal` call only `useEmployeeSchedule` /
  `useWorkSchedule`, which call only `employeeService`, which calls only `src/lib/api.ts`. No
  component fetches directly.
- **II. Service-Only Backend Access** — PASS. All five new endpoints are added exclusively to
  `employeeService.ts`. The `lib/api.ts` change is additive (attaches `status` to the error it
  already throws) and does not introduce a second access path.
- **III. Strict TypeScript** — PASS. New backend-shape types (`EmployeeWeeklySchedule`,
  `JustifiedAbsence`, `AttendanceVerificationResponse`, etc.) and new client-side view-model
  types (`CalendarCellState`, `CalendarDayCell`, `EmployeeScheduleRow`) are added to
  `types/employee.ts` and re-exported via the existing `types/index.ts` `export *`. No `any`.
- **IV. Component Focus & Size Discipline** — PASS by design. The calendar UI is deliberately
  split into `ScheduleTab` (shell: month nav, filter, legend, orchestration),
  `ScheduleGrid` (all-employees roster), `ScheduleMonthCalendar` (single-employee view), and
  `JustifyAbsenceModal` (justify/remove action), each targeting the ~150-line practical
  ceiling, rather than one large component handling every mode. The `CalendarCellState` →
  color/icon/tooltip mapping that both `ScheduleGrid` and `ScheduleMonthCalendar` need is
  factored into one shared `scheduleCellVisual.ts` helper rather than duplicated in both
  files — keeping each component focused on layout, not also owning a copy of the status
  vocabulary.
- **V. Consistency Over Novelty** — PASS. Extends the existing `EmployeeFormModal` rather than
  adding a separate schedule-editing screen; the schedule toggle reuses the same
  explicit-mode-switch pattern already used for account-linking in that same modal; the new
  tab follows the established `components/HR/` subfolder + prop-less-tab convention; status
  colors reuse the app's existing green/red semantic pairing; no new UI library.

No violations requiring justification — Complexity Tracking table is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/005-hr-schedule-tab/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── api.ts                              # MODIFIED: attach `status` (HTTP code) to thrown errors
│   └── api.test.ts                         # NEW: regression coverage for the status-code addition
├── types/
│   └── employee.ts                         # ADD: EmployeeWeeklySchedule, UpdateEmployeeWeeklyScheduleRequest,
│                                            #      JustifiedAbsence, CreateJustifiedAbsenceRequest,
│                                            #      AttendanceDayStatus, AttendanceDay, AttendanceVerificationResponse,
│                                            #      CalendarCellState, CalendarDayCell, EmployeeScheduleRow
├── services/
│   └── employeeService.ts                  # ADD: getSchedule, updateSchedule, listJustifiedAbsences,
│                                            #      createJustifiedAbsence, deleteJustifiedAbsence,
│                                            #      getAttendanceVerification
├── hooks/
│   ├── useEmployeeSchedule.ts              # NEW: single-employee schedule get/save — powers
│                                            #      the EmployeeFormModal schedule editor (User Story 1)
│   └── useWorkSchedule.ts                  # NEW: month-scoped, all-active-employees schedule +
│                                            #      attendance aggregation (conditional schedule fetch,
│                                            #      lazy justified-absence id resolution), plus
│                                            #      justify/remove-absence mutations — powers
│                                            #      ScheduleTab (User Stories 2-3)
├── components/
│   ├── EmployeeFormModal.tsx                # MODIFIED: add weekly-schedule editor section
│   ├── HR.tsx                               # MODIFIED: add 'schedule' tab (between journey and lateness)
│   └── HR/
│       ├── ScheduleTab.tsx                  # NEW: shell — month nav, employee filter, legend,
│       │                                    #      renders ScheduleGrid or ScheduleMonthCalendar
│       ├── scheduleCellVisual.ts            # NEW: shared CalendarCellState → {className, icon, label}
│       │                                    #      helper, imported by both components below
│       ├── ScheduleGrid.tsx                 # NEW: all-employees roster grid (rows=employees, cols=days)
│       ├── ScheduleMonthCalendar.tsx        # NEW: single-employee 7-column month calendar
│       └── JustifyAbsenceModal.tsx          # NEW: justify (reason, optional) / remove-justification action
```

**Structure Decision**: Single existing frontend project (Vite/React SPA). No new top-level
directories. Follows the `components/HR/` subfolder precedent set by `specs/003-hr-salary-tab`
and `specs/004-hr-journey-tab` for the new tab's components, and extends the existing
`types/employee.ts` → `services/employeeService.ts` → `hooks/` chain rather than introducing a
parallel "schedule" domain slice, since all five new endpoints live under `/employees/*` in the
API contract and the existing `Employee` domain slice is the natural home for them.

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
