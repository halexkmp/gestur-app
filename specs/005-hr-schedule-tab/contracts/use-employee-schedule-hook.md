# Contract: `useEmployeeSchedule` hook

Powers the weekly-schedule editor added to `EmployeeFormModal` (User Story 1). One employee at
a time — the modal already scopes to a single `Employee | null`.

## Signature

```text
useEmployeeSchedule(employeeId: string | null): {
  schedule: EmployeeWeeklySchedule | null   // null = not yet loaded OR confirmed not configured
  isConfigured: boolean                      // true once a real schedule row exists (loaded, not null)
  loading: boolean
  error: string | null

  load(): Promise<void>                      // GET /employees/schedule/{employeeId}; sets
                                              // schedule=null + isConfigured=false on a 404
                                              // (via ApiError, see contracts/api-error-status.md),
                                              // rethrows/sets `error` for any other failure

  save(days: Omit<EmployeeWeeklySchedule, 'employee_id'>): Promise<boolean>
                                              // PUT /employees/schedule/{employeeId} with the
                                              // full 7-flag payload; returns true on success
}
```

## Behavioral contract

- `employeeId === null` (creating a brand-new employee, not yet saved) ⇒ `load()` is a no-op,
  `schedule` stays `null`, `isConfigured` stays `false`; the modal only calls `save()` for a new
  employee *after* the employee's own `POST /employees/` has resolved and produced an id, since
  the schedule endpoint is keyed by an existing `employee_id` (mirrors the existing pattern
  where the modal already sequences employee-create before user-account operations that need
  the new employee's id).
- `load()` distinguishes "no schedule configured" (404 → `schedule: null`, `isConfigured: false`,
  no `error` set — this is not a failure state) from every other failure (network/500/etc. →
  `error` set, `schedule` left as whatever it was before, so a transient failure doesn't
  mislead the UI into showing "not configured").
- `save()` always sends all seven flags (full replace, per contract — no partial patch), even
  when every flag is `false`; on success it updates local `schedule` to the response and sets
  `isConfigured: true`. This is the explicit "configured with zero work days" state described
  in `research.md`'s two-state-toggle decision — distinct from never calling `save()` at all.
- `save()` is never called automatically; `EmployeeFormModal` only invokes it if HR has switched
  the schedule section's toggle to "configure work days" for this submission. Leaving the
  toggle in its initial "not configured" position (the default when `isConfigured` is `false`
  on load) means the form's submit handler skips the schedule call entirely, preserving the
  employee's actual "no schedule" backend state instead of silently creating an all-false row.

## Non-goals

- Does not expose a "clear schedule" action — no `DELETE` endpoint exists for this resource per
  the contract; once configured, a schedule can only be replaced, never removed back to the
  404 state, from the UI in this feature.
- Does not fetch or care about justified absences or attendance data — that's `useWorkSchedule`'s
  responsibility, kept separate because `EmployeeFormModal` only ever needs the schedule shape.
