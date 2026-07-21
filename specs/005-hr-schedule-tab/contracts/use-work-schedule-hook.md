# Contract: `useWorkSchedule` hook

Powers `ScheduleTab` and its children (User Stories 2-3): the roster grid, the single-employee
month calendar, and the justify/remove-justification actions.

## Signature

```text
useWorkSchedule(): {
  rows: EmployeeScheduleRow[]           // see data-model.md; one entry per active employee
  month: number
  year: number
  setMonth(month: number): void
  setYear(year: number): void
  loading: boolean                      // true while (re)computing rows for month/year
  error: boolean                        // true if the employee list or any per-employee call failed

  justifyAbsence(employeeId: string, date: string, reason?: string): Promise<boolean>
  removeJustification(employeeId: string, date: string): Promise<boolean>
}
```

Note `removeJustification` takes `(employeeId, date)`, not a pre-known `JustifiedAbsence.id` —
the id is resolved internally, lazily, only when this is called (see below). `CalendarDayCell`
never carries an id (see `data-model.md`).

## Behavioral contract

- On mount, and whenever `month`/`year` changes: fetches `GET /employees/?active=true`, then for
  every returned employee, in parallel, fetches `GET /employees/attendance-verification/{id}?month&year`
  (always) and, conditionally, `GET /employees/schedule/{id}` (via `employeeService.getSchedule`,
  which resolves to `null` on 404 rather than throwing — see `contracts/api-error-status.md`) —
  **only** for an employee that is active, has a linked `user_id`, and whose
  attendance-verification `days[]` came back empty (the one case genuinely ambiguous between
  "no schedule configured" and "schedule configured with zero work days"; see `data-model.md`'s
  employee-level derivation pass, steps 1-4). This does **not** call
  `GET /employees/justified-absences` at all — see the dedicated lookup in
  `removeJustification` below. Composes the result into one `EmployeeScheduleRow` per
  `data-model.md`. Matches spec FR-004/FR-005.
- `loading` is `true` for the full fetch-and-compose cycle; `rows` should be treated as
  "in flight" during `loading`, not stale-but-usable — same convention as
  `useEmployeePaychecks` (`specs/003-hr-salary-tab/contracts/employee-paychecks-hook.md`).
- `error` is set if the active-employee list call fails, or if any per-employee
  attendance-verification/schedule call fails; on `error`, `ScheduleTab` shows a retry
  affordance rather than a partial grid.
- `justifyAbsence(employeeId, date, reason)` calls `employeeService.createJustifiedAbsence`
  with `{ employee_id: employeeId, absence_date: date, reason: reason ?? null }`. Per contract,
  this can fail with `400` if the date isn't one of the employee's scheduled work days or a
  justification already exists for that date — `JustifyAbsenceModal` surfaces the thrown
  `Error.message` inline rather than treating it as a generic failure. On success (`201`, no
  body per contract), re-fetches only that employee's attendance-verification for the current
  month/year and updates just that employee's row in `rows`, so the rest of the grid doesn't
  need to reload.
- `removeJustification(employeeId, date)`:
  1. Calls `employeeService.listJustifiedAbsences({ employee_id: employeeId, month, year })` —
     a fresh, uncached lookup made only at this moment, for this one employee/month.
  2. Finds the entry whose `absence_date === date`. If none is found (e.g. the record was
     already removed elsewhere since the cell was rendered), returns `false` and surfaces an
     inline "justificativa não encontrada, atualize a página" message rather than throwing.
  3. Otherwise calls `employeeService.deleteJustifiedAbsence(match.id)`; on success (`204`),
     re-fetches only that employee's attendance-verification and updates their row, same
     partial-refresh approach as `justifyAbsence`.
- Both mutation functions return `false` (and set an inline error surfaced by the calling
  modal, not the hook's own `error` flag — that flag is reserved for the initial load) on
  failure, `true` on success, letting `JustifyAbsenceModal` decide whether to close itself.

## Non-goals

- Does not poll or subscribe for live updates — a manual month/year change or a mutation's own
  partial refresh is the only way `rows` changes, consistent with the no-live-recalculation
  precedent in `specs/003-hr-salary-tab`.
- Does not paginate or virtualize `rows` — same small-headcount scale assumption as
  `specs/003-hr-salary-tab/research.md`.
- Does not eagerly fetch or cache justified-absence records or their ids for every employee —
  deliberately deferred to the moment `removeJustification` is called, to avoid an extra
  request per employee on every load for a capability most page views never use (see
  `research.md`'s lazy-resolution decision).
- Does not compute or expose the single-employee-selected filtering — that's `ScheduleTab`'s
  own local UI state, filtering the already-fetched `rows` for the `ScheduleMonthCalendar` view;
  it is not a hook concern since it never triggers a new fetch.
