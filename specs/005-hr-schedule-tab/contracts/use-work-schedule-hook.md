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

- On mount, and whenever `month`/`year` changes: fetches `GET /employees/` and
  `GET /employees/schedule-overview?month&year` in parallel (`Promise.all`) — two requests
  total, regardless of headcount. The overview response's `items[]` is indexed by
  `employee_id`; each employee in the fetched list is matched against it (or found absent) and
  composed into one `EmployeeScheduleRow` per `data-model.md`'s derivation rules. This does
  **not** call `GET /employees/schedule/{id}`, `GET /employees/attendance-verification/{id}`, or
  `GET /employees/justified-absences` for the bulk load at all — see the dedicated lookups in
  `removeJustification` below and in `refreshEmployeeRow`. Matches spec FR-004/FR-005.
- `loading` is `true` for the full fetch-and-compose cycle; `rows` should be treated as
  "in flight" during `loading`, not stale-but-usable — same convention as
  `useEmployeePaychecks` (`specs/003-hr-salary-tab/contracts/employee-paychecks-hook.md`).
- `error` is set if the employee list call or the schedule-overview call fails; on `error`,
  `ScheduleTab` shows a retry affordance rather than a partial grid.
- `justifyAbsence(employeeId, date, reason)` calls `employeeService.createJustifiedAbsence`
  with `{ employee_id: employeeId, absence_date: date, reason: reason ?? null }`. Per contract,
  this can fail with `400` if the date isn't one of the employee's scheduled work days or a
  justification already exists for that date — `JustifyAbsenceModal` surfaces the thrown
  `Error.message` inline rather than treating it as a generic failure. On success (`201`, no
  body per contract), refreshes only that one employee's row via
  `GET /employees/attendance-verification/{id}?month&year` (the single-employee endpoint — not
  a re-fetch of the bulk overview, which would be wasteful just to update one row) and updates
  it in `rows`, so the rest of the grid doesn't need to reload.
- `removeJustification(employeeId, date)`:
  1. Calls `employeeService.listJustifiedAbsences({ employee_id: employeeId, month, year })` —
     a fresh, uncached lookup made only at this moment, for this one employee/month.
  2. Finds the entry whose `absence_date === date`. If none is found (e.g. the record was
     already removed elsewhere since the cell was rendered), returns `false` and surfaces an
     inline "justificativa não encontrada, atualize a página" message rather than throwing.
  3. Otherwise calls `employeeService.deleteJustifiedAbsence(match.id)`; on success (`204`),
     refreshes only that employee's row via the single-employee attendance-verification
     endpoint, same partial-refresh approach as `justifyAbsence`.
- Both mutation functions return `false` (and set an inline error surfaced by the calling
  modal, not the hook's own `error` flag — that flag is reserved for the initial load) on
  failure, `true` on success, letting `JustifyAbsenceModal` decide whether to close itself.

## Non-goals

- Does not poll or subscribe for live updates — a manual month/year change or a mutation's own
  partial refresh is the only way `rows` changes, consistent with the no-live-recalculation
  precedent in `specs/003-hr-salary-tab`.
- Does not paginate or virtualize `rows` — same small-headcount scale assumption as
  `specs/003-hr-salary-tab/research.md` (though the bulk overview endpoint means this scales
  far better than that precedent even at larger headcounts, since the request count no longer
  grows with `E` at all).
- Does not eagerly fetch or cache justified-absence records or their ids for every employee —
  deliberately deferred to the moment `removeJustification` is called, to avoid an extra
  request for a capability most page views never use (see `research.md`'s lazy-resolution
  decision).
- Does not pass `employee_ids` to the overview call — every caller wants all employees, which
  is the endpoint's own default when the param is omitted (see `research.md`).
- Does not compute or expose the single-employee-selected filtering — that's `ScheduleTab`'s
  own local UI state, filtering the already-fetched `rows` for the `ScheduleMonthCalendar` view;
  it is not a hook concern since it never triggers a new fetch.
