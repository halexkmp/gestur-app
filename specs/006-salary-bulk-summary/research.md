# Phase 0 Research: Salary Tab Bulk Data Loading

All Technical Context items were resolvable from the existing codebase (the pattern this
feature replicates already ships for the Work Schedule tab). No items remain marked `NEEDS
CLARIFICATION`. This document records the decisions and why alternatives were rejected.

## 1. Shape and naming of the new bulk endpoint

**Decision (superseded by the now-confirmed contract)**: The backend implemented this as
`GET /employees/salary-summary?month={int}&year={int}` — reusing the original path and
removing the old `{employee_id}` single-employee form entirely, rather than adding a new
`-overview`-suffixed sibling route. Response is `{ items: SalarySummaryOverviewItem[] }`
where each item is today's per-employee `SalarySummaryResponse` fields plus an embedded
`advances` array of a narrower shape (`id, amount, advance_date, note` — not the full
`SalaryAdvance` type; see §5). Both query params are optional and default to the current
month/year. See `contracts/salary-summary-overview.md` for the confirmed shape and
`specs/api/employees.md`'s "Salary Summary (All Employees)" section for the authoritative
version.

*(This decision originally proposed a new `/employees/salary-summary-overview` path,
reasoning below, before the backend's actual implementation was confirmed. That path was
never built — the rationale is kept for context on why a bulk consolidation was the right
call in general, not as a description of the shipped path.)*

**Rationale**: `GET /employees/schedule-overview` is the exact same class of problem already
solved once in this codebase: consolidate N per-employee calls into one bulk call, keyed by
month/year, returning `items: [...]`. The user's own description ("send only year or month,"
"return... for all," "the [advances] request... will return this list") maps onto that
existing shape — the backend chose to deliver it by repurposing the existing
`/employees/salary-summary` path instead of adding a new one, which is an equally valid
resolution of the same consolidation goal.

**Alternatives considered** (moot now that the backend's actual choice is confirmed, kept for
history):
- Overload the existing `GET /employees/salary-summary/{employee_id}` route to also accept a
  bulk mode when `{employee_id}` is omitted — this is, in effect, what the backend did:
  removed the path-param form and made the bare path always bulk. The concern raised at the
  time ("breaks the existing single-employee contract for any other caller") turned out not
  to matter in practice — no caller outside this tab used the single-employee form.
- A GraphQL-style single query endpoint - rejected: this REST-only backend has no such
  pattern anywhere in `specs/api/*.md`; would be a novel idiom for one feature.

## 2. Does the bulk endpoint need an `employee_ids` filter, like `schedule-overview` has?

**Decision**: No — omit it. The endpoint accepts only `month`/`year`.

**Rationale**: The user's description explicitly scopes this to "send only year or month."
Every current and foreseeable caller (the Salário tab) wants all active employees every time;
the existing client-side employee filter (added just before this feature) already narrows the
*displayed* rows without needing a server-side filter. `getScheduleOverview`'s own
`employee_ids` param is commented in `employeeService.ts` as unused today for the same reason
("every current caller wants 'all employees' anyway"). Adding an unused param would be
speculative scope, which Constitution Principle V and general YAGNI both argue against.

**Alternatives considered**: Add `employee_ids` for future-proofing / symmetry with
`schedule-overview` — rejected: no current requirement calls for it, and it can be added later
without a breaking change if a real need appears.

## 3. Does the frontend still need `GET /employees/` (the plain employee list) alongside the new bulk call?

**Decision**: Yes — keep calling `employeeService.getAll()` in parallel with the new
`getSalarySummaryOverview()` call (via `Promise.all`, exactly as `useWorkSchedule.ts` already
does for `getScheduleOverview`), and merge the two by `employee_id`.

**Rationale**: `employee_id`, `employee_name`, and `base_salary` come from the `Employee`
record, not from the salary-summary contract (see `specs/api/employees.md` "Employee" vs.
"Salary Summary" sections — they're documented as separate resources). The bulk salary
endpoint has no reason to duplicate employee name/base-salary data that already has a
canonical source. This also naturally handles the "employee has no summary yet" edge case
(spec Edge Cases) the same way `useWorkSchedule.ts` already handles "employee has no schedule
entry in `overview.items`" — the merge just leaves that employee's summary fields undefined,
and the row falls back to showing `base_salary` until data exists.

**Update (post-contract-confirmation)**: this call is now doing double duty. The confirmed
contract returns `items` for *every* employee in the system, active or not ("not filtered by
`active` status"). Keeping `getAll()` + its existing `.filter(e => e.active)` as the loop the
merge iterates over means inactive employees' overview items are simply never looked up,
which is both the simplest fix and already exactly what the pre-existing code did for the
"no active-employee filter needed from the backend" reason above — no new code path required.

**Alternatives considered**: Have the bulk salary endpoint also return `employee_name` /
`base_salary` directly, dropping the separate `getAll()` call — rejected: duplicates data
already owned by the `Employee` resource, and diverges from the `schedule-overview` precedent
(which also keeps `getAll()` as a separate parallel call rather than embedding employee
identity fields in the overview response).

## 4. How do salary-advance create/delete refresh the UI after this change?

**Decision**: After `createAdvance` / `deleteAdvance` succeeds, re-run the same bulk
`fetchPaychecks()` used for the initial/period-change load, rather than keeping the current
targeted per-employee refresh (`refreshEmployee` + `loadAdvancesForEmployee`).

**Rationale**: Once summaries and advances only exist as part of the bulk overview response,
there is no longer a cheap single-employee lookup being called by this tab to target a
refresh at — re-fetching the bulk overview is now the simplest correct way to bring every
figure (that employee's total, net salary, and advances list) back in sync, and it still
satisfies FR-007 ("without requiring HR to reload the whole tab") because the re-fetch happens
automatically inside the mutation handler, not as a manual step. This also deletes code:
`refreshEmployee`/`loadSummaryForEmployee`/`loadAdvancesForEmployee` and their `useCallback`
dependency-chain complexity go away entirely.

**Alternatives considered**: Keep calling the old single-employee
`GET /employees/salary-summary/{employee_id}` and `GET /employees/salary-advances` endpoints
just for this one post-mutation refresh path, while using the new bulk endpoint for the
initial/period-change load — rejected: mixes two data-loading strategies in one hook for no
real benefit (a full bulk re-fetch after a single mutation is not expensive — the whole point
of this feature is that the bulk call is cheap), and keeps dead-weight complexity the rest of
this feature is explicitly removing.

## 5. Where do advances live in frontend state after this change?

**Decision**: Advances move from a hook-level cache (`advancesByEmployee: Record<string,
SalaryAdvance[]>`, populated by a separate lazy call) to being embedded directly inside the
same object as that employee's summary in the `paychecks` array. See `data-model.md`.

**Rationale**: The backend response embeds them (per the user's description: "the request
salary summary will return this list"), so there is no longer a separate fetch whose result
needs its own cache keyed by employee id — carrying that separate cache forward would just be
unnecessary indirection now that the data arrives together. `getAdvancesForEmployee` as a
public hook function is no longer needed either; `EmployeePaycheckRow` can read `paycheck.
advances` directly.

**Alternatives considered**: Keep the separate `advancesByEmployee` map for minimal diff
against `EmployeePaycheckRow`'s current prop shape — rejected: keeps a redundant piece of
state in sync with `paychecks` for no reason once both are populated by the same response;
Constitution Principle IV favors removing unneeded complexity, not preserving it for diff
minimization.

**Correction (post-contract-confirmation)**: the embedded advance is **not** the existing
`SalaryAdvance` type — the confirmed shape is narrower (`id, amount, advance_date, note`; no
`employee_id`, `created_at`, or `times`). `types/employee.ts` needs a distinct
`SalarySummaryOverviewAdvance` type for this, not a reuse of `SalaryAdvance`. The missing
`employee_id` has one concrete consequence: `SalaryTab.tsx`'s delete-advance call site
currently reads `advance.employee_id` — that field won't exist on the embedded advance, so
the fix must read the **parent `EmployeePaycheck.employee_id`** instead (available via
closure where each row is rendered). See `data-model.md` and `tasks.md` T013.

## 6. Backend dependency status

**Decision (superseded — dependency resolved)**: `specs/api/employees.md` has since been
updated by hand to document this endpoint for real, under "Salary Summary (All Employees)".
This section originally treated the bulk endpoint as an explicit, documented *external*
dependency (`contracts/salary-summary-overview.md`, marked PROPOSED), following the precedent
of `specs/002-lateness-salary-visibility/contracts/employee-self-service-salary.md` — that
framing is now resolved. `contracts/salary-summary-overview.md` has been updated to CONFIRMED
status and now summarizes (rather than proposes) the shape documented in
`specs/api/employees.md`.

**What changed between the proposal and the confirmed contract** (the two corrections that
matter for implementation, detailed in §1 and §5 above):
- Endpoint path is `/employees/salary-summary` (reusing the original path), not a new
  `/employees/salary-summary-overview` path.
- `items` includes every employee in the system, not just active ones; the frontend's
  existing active-employee filter (via `getAll()`) still needs to run, now doing double duty.
- The embedded `advances` shape is narrower than the standalone `SalaryAdvance` type.

**Rationale for treating it as resolved now**: `CLAUDE.md`'s "sole source of truth for
backend behavior" convention means `specs/api/employees.md` is authoritative once updated —
there is no longer a live-behavior gap for this plan to track as a risk.
