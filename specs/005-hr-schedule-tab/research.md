# Phase 0 Research: HR Work Schedule Tab (Escala de Trabalho)

No `[NEEDS CLARIFICATION]` markers were carried over from `spec.md` (its Assumptions section
already resolved every open scope question). Research here covers the technical decisions
needed to execute the plan, driven heavily by the explicit "apply UX best practices" request
and by a real gap found in `src/lib/api.ts` while designing the schedule-editing flow.

## Decision: Attach the HTTP status code to errors thrown by `src/lib/api.ts`

**Decision**: Extend `request<T>` in `src/lib/api.ts` so the `Error` it throws on a non-2xx,
non-401 response also carries the response's HTTP status (e.g. a small `ApiError extends Error`
with a `status: number` field), instead of only the `detail` message string it captures today.

**Rationale**: Per `specs/api/employees.md`, `GET /employees/schedule/{employee_id}` returning
`404 Not Found` is an explicitly meaningful, distinct state ("no schedule has ever been set for
that employee... there is no all-working/all-off default to fall back to"), not a failure to
surface to the user. The current `api.ts` (`request<T>`) throws `new Error(error.detail || '...')`
and discards `response.status` entirely, so a service method has no reliable way to tell "the
schedule doesn't exist yet" apart from "the request failed for some other reason" (network
error, 500, permission issue) without guessing at the error message text. This distinction
matters directly for spec FR-011 and Edge Cases (no-schedule vs. no-linked-account vs.
inactive must each render differently, not collapse into a generic error state).

**Alternatives considered**:
- *String-match the error message (e.g. check for `"Not Found"`)*: rejected — the contract
  documents the status code (`404 Not Found`), not a specific response body string; relying on
  incidental framework defaults (e.g. FastAPI's default 404 body) is fragile and would silently
  break if the backend's error body format ever changes.
- *Swallow every error from `getSchedule` as "no schedule"*: rejected — would mask real
  failures (network outage, 500, a genuine 403) as "no schedule configured," producing an
  incorrect and misleading UI state instead of an error message.
- *Add a separate one-off fetch path just for this endpoint, bypassing `api.ts`*: rejected —
  directly violates Constitution Principle II (Service-Only Backend Access via `lib/api.ts`).

**Scope of the change**: Purely additive — existing call sites that only read `err.message`
(every current service/hook) are unaffected; only new code added by this feature reads
`err.status`. A new `src/lib/api.test.ts` is added to lock in both the pre-existing
message-passthrough behavior and the new status-code behavior, since this file has no test
coverage today and is now foundational to a user-visible state distinction.

## Decision: Use `GET /employees/schedule-overview` for the roster load; single-employee
endpoints only for a per-row refresh (supersedes the original per-employee aggregation)

**Decision**: `useWorkSchedule`'s initial/month-change load now issues exactly two requests
regardless of headcount: `GET /employees/?active=true` (well, `GET /employees/` — see the
existing note elsewhere in this file about needing all employees, not just active ones) and
one call to the new bulk `GET /employees/schedule-overview?month&year` (see
`specs/api/employees.md`, "Employee Schedule Overview (Bulk)"), issued in parallel via
`Promise.all`. The response's `items[]` is keyed by `employee_id`; an employee present in
`items` has a schedule (its own `monday`..`sunday`, `days`, `unjustified_absence_count` are
used exactly like the single-employee endpoints' equivalents), an employee **absent** from
`items` has no schedule at all — the contract's own wording ("Employees with no schedule are
omitted entirely from `items`") makes *presence in the array itself* the "has a schedule"
signal, eliminating the need for a separate conditional fetch to disambiguate "no schedule" from
"schedule with an empty `days[]`" (an all-days-off schedule still appears in `items`, just with
`days: []`). `GET /employees/schedule/{id}` and `GET /employees/attendance-verification/{id}`
still exist and are still used — but only for the single-employee, single-row refresh after a
justify/remove action (see the next Decision) and for `useEmployeeSchedule` (the CRUD editor,
User Story 1), never for the bulk roster load anymore.

**Rationale**: This is a straightforward replacement of a documented, already-accepted
trade-off (see the superseded version of this decision, kept below for history) once the
backend actually shipped the bulk endpoint it was deferred pending. Two requests total (down
from `1 + E (+ rare S)`) is a strictly better outcome at any headcount, and it also removes an
entire category of client-side logic (the "is this employee's empty `days[]` ambiguous"
check and its conditional `getSchedule` call) since the bulk response's own shape already
disambiguates it. `Employee.active`/`Employee.user_id` are still read directly off the
already-fetched employee list for the inactive/no-linked-account cases — the bulk endpoint
doesn't change that part, since those two "no data" reasons are properties of the employee
record itself, not of their schedule.

**Alternatives considered**:
- *Keep the per-employee aggregation now that a bulk endpoint exists*: rejected — no reason to
  keep paying `N`+ requests once a single call returns the same data for everyone.
- *Pass `employee_ids` explicitly to scope the bulk call*: rejected — `src/lib/api.ts`'s query
  param serializer joins array values into one comma-separated string rather than emitting
  repeated `employee_ids=` pairs (the contract's documented "repeatable query param" format),
  and every caller here wants "all employees" anyway, which is the endpoint's own default when
  the param is omitted — so omitting it entirely is both simpler and avoids depending on a
  serialization format `api.ts` doesn't currently support.

<details>
<summary>Superseded: original per-employee aggregation decision (kept for history)</summary>

**Original decision**: `useWorkSchedule` fetched active employees, then for every employee
always issued `GET /employees/attendance-verification/{id}?month&year`, and issued
`GET /employees/schedule/{id}` only for an employee that was active, had a linked `user_id`,
and got back an empty `days[]` (the one case genuinely ambiguous between "no schedule at all"
and "schedule exists but is explicitly set to zero work days"). `GET /employees/justified-absences`
was not called during this load at all.

**Original rationale**: At the time, `specs/api/employees.md` had no bulk/batch variant of any
of these endpoints — a naive eager implementation would have cost `1 + 3E` requests; the
conditional-fetch design cut that to `1 + E (+ rare S)`. This is now moot — the bulk endpoint
documented above replaces it entirely, cutting the cost to a flat `2` requests regardless of
`E`.

</details>

## Decision: Resolve a justified absence's id lazily, only when HR opens the "remove" action

**Decision**: `useWorkSchedule` never calls `GET /employees/justified-absences` as part of its
eager per-employee load. `removeJustification(employeeId, date)` instead calls
`employeeService.listJustifiedAbsences({ employee_id: employeeId, month, year })` itself, at
the moment HR opens the remove-confirmation modal for a `JUSTIFIED_ABSENCE` cell, finds the
record matching `date`, and deletes it by that record's `id`.

**Rationale**: The only reason this feature ever needs a `JustifiedAbsence.id` at all is to
call `DELETE /employees/justified-absences/{id}` — a deliberate, comparatively rare action.
Fetching the full justified-absences list for every active employee on every month load, just
so an id is "ready" in case someone clicks remove, is a full extra request per employee for a
lookup the vast majority of page views never use. Resolving it on demand costs exactly one
request, exactly when it's needed, and keeps `useWorkSchedule`'s eager load limited to the
attendance data every view actually renders. This also removes what would otherwise be a
structural dependency of the roster/calendar (User Story 2) on the justify/remove machinery
(User Story 3) — User Story 2 now never touches justified-absences at all, keeping the two
stories cleanly independent.

**Alternatives considered**:
- *Fetch justified-absences eagerly alongside schedule/attendance, cache ids on each
  `CalendarDayCell`*: rejected — the original approach; pays a request per employee per month
  for a capability (removal) most page views never invoke, and made User Story 2's hook
  implementation depend on a User Story 3 service method to compile cleanly.
- *Cache the on-demand lookup's result for the rest of the session*: rejected as unnecessary
  complexity for a single-click flow — a fresh lookup at click time is simple, always correct
  (no risk of acting on a stale id if the record changed since the row was rendered), and costs
  one request.

## Decision: Roster grid by default, literal month calendar when one employee is selected

**Decision**: `ScheduleTab` renders `ScheduleGrid` (rows = employees, columns = days of the
selected month, sticky name column, horizontally scrollable) when no specific employee is
selected, and switches to `ScheduleMonthCalendar` (a traditional Monday–Sunday, week-row month
grid) once HR filters down to one employee.

**Rationale**: The spec asks for both "an interactive calendar" (FR-004) and the ability to see
"who is working... which one is absent... at a glance" across the team (SC-003: identify every
unresolved absence within 30 seconds). A full month calendar per employee, shown for every
employee simultaneously, does not scan well — it would require scrolling through many
independent grids to spot problems, working against SC-003. A roster/matrix grid is the
standard information architecture for exactly this "who's in, who's out, across a team" problem
(the same shape as shift-schedule and attendance-roster tools generally), and stays scannable
regardless of headcount. The literal calendar view is preserved for the single-employee case
(FR-007's "narrow to a specific employee"), which is where a calendar's day-of-week framing
actually adds value over a flat row.

**Alternatives considered**:
- *Always show one full calendar per employee, stacked*: rejected — fails SC-003 for any
  team beyond a handful of people; poor use of screen space for a mostly-repetitive pattern
  (most days are just "worked" or "day off").
- *Only ever show a single flat table, no calendar view at all*: rejected — doesn't satisfy the
  spec's explicit ask for an "interactive calendar," and loses the day-of-week context (Mon vs.
  Sat) that a calendar view makes immediately legible for one employee's pattern.
- *Tabs or a dropdown per employee, one calendar visible at a time by default*: rejected as the
  *default* — would hide the "all employees at once" comparison FR-007 explicitly asks to keep
  available; kept only as the single-employee mode, reached via the existing filter, not as a
  forced navigation step.

## Decision: Status communicated with color + icon together, reusing existing app semantics

**Decision**: Each day cell uses a paired color + icon, never color alone:
worked → green + check icon; justified absence → slate/blue + a neutral document icon;
unjustified absence → red + alert icon; not a scheduled day → muted gray, no icon (low visual
weight, "nothing to see here"); no data (no schedule at all / no linked account / inactive /
before hire date) → hatched/dashed muted cell with a tooltip explaining which of those reasons
applies. Green/red reuse the exact Tailwind shades already used for the Ativo/Inativo badge in
`HR.tsx`'s employee table.

**Rationale**: The user's request to apply "UX best practices... clear in the information
passed to the user" is best satisfied by (a) never encoding meaning in color alone
(accessibility — color-blind users must still be able to distinguish states from shape/icon),
and (b) reusing colors the app already assigns a meaning to, rather than introducing a second,
conflicting color vocabulary for "good/bad" (Constitution Principle V — consistency over
novelty). Collapsing "no schedule," "no linked account," and "inactive" into one *visual*
no-data treatment (with the specific reason only in a tooltip) keeps the grid legible at a
glance while still letting HR discover the specific cause on demand — a progressive-disclosure
choice consistent with `specs/003-hr-salary-tab`'s precedent.

**Alternatives considered**:
- *One generic "warning" color for both justified and unjustified absence*: rejected — directly
  defeats the feature's purpose (spec's core ask is telling the two apart) and fails SC-005.
  *Distinct saturated colors for all three "no data" sub-reasons*: rejected — would raise the
  total number of at-a-glance colors from 3 meaningful states to 6, working against
  scannability; the specific reason is secondary information, appropriate for a tooltip, not a
  fourth-through-sixth color in the primary legend.

## Decision: Only actionable cells respond to interaction

**Decision**: Pointer cursor, hover highlight, and click handling are present only on
unjustified-absence cells (opens `JustifyAbsenceModal` to justify) and justified-absence cells
(opens the same modal, in "remove" mode). Worked, not-scheduled, and no-data cells render as
static, non-interactive content.

**Rationale**: Standard interaction-design practice — affordances should exist only where an
action is actually possible, otherwise users waste time clicking dead cells or, worse, are
uncertain what is clickable at all. This is the direct interpretation of "the interactive
calendar... should be easy to use."

**Alternatives considered**:
- *Make every cell clickable, showing a "no action available" message for inert ones*: rejected
  — adds a wasted round trip (click → dismiss) for the majority of cells in any given month.

## Decision: Explicit two-state toggle for schedule editing in `EmployeeFormModal`

**Decision**: The schedule section in `EmployeeFormModal` starts in a "no schedule configured"
state (matching an employee that has never had `PUT /employees/schedule/{id}` called) and
exposes an explicit switch to "configure work days," which reveals the seven day checkboxes.
Leaving the section untouched means no schedule API call is made at all on save (preserving a
true 404/never-configured backend state); switching it on and saving always sends a full
`PUT /employees/schedule/{id}` with whatever boxes are checked, including the case where none
are checked (which explicitly means "configured, currently no work days" — a different backend
state than never having configured a schedule).

**Rationale**: `specs/api/employees.md` treats "no schedule row exists" (404) and "schedule row
exists with all seven flags false" as two distinct, both meaningful, states — exactly the
subject of this spec's final Edge Case. A plain "check the days you work" widget with no
enable/disable toggle cannot express "don't touch this at all" vs. "explicitly set to zero
days," so an explicit two-state toggle is required to preserve the distinction. This also
mirrors the existing three-way account-link toggle (`Nenhuma` / `Vincular existente` / `Criar
nova`) already present in the same modal (Constitution Principle V).

**Alternatives considered**:
- *Always show the seven checkboxes, default all unchecked*: rejected — every employee edit
  would implicitly call `PUT` even when HR never intended to touch scheduling, silently
  creating a "configured, zero days" schedule row for employees that should remain
  unconfigured.
- *A single "clear schedule" action calling `DELETE`*: rejected — no delete endpoint exists for
  Employee Weekly Schedule in the contract; only `GET`/`PUT` are documented.
