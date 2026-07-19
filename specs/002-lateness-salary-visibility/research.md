# Phase 0 Research: Lateness Configuration & Employee Salary Visibility

All Technical Context items were resolvable from the existing codebase and the prior
`/speckit-clarify` session — no items remain marked `NEEDS CLARIFICATION`. This document
records the decisions and why alternatives were rejected.

## 1. Where does the lateness configuration UI live?

**Decision**: A new third tab (`lateness`) inside the existing `HR.tsx` screen, alongside
its current `employees` and `advances` tabs, backed by a new extracted component
`LatenessConfigPanel.tsx`.

**Rationale**: `HR.tsx` already gates itself to `isSuperAdmin || isHR` and already uses a
tab pattern (`activeTab: 'employees' | 'advances'`) for HR-scoped sub-views. Constitution
Principle V prefers extending existing screens over adding new top-level nav pages. A
config editor that's touched rarely doesn't warrant its own sidebar entry.

**Alternatives considered**:
- New top-level nav page (own sidebar entry in `Layout.tsx` + case in `App.tsx`) — rejected:
  adds permanent nav clutter for a rarely-used settings screen, and there's no reason this
  needs to be reachable outside the HR context.
- A modal launched from the employees tab — rejected: the configuration isn't tied to any
  one employee record, so a modal anchored to the employee list would be a confusing place
  to find it.

## 2. Where does the employee salary visibility section live?

**Decision**: A new section, extracted into `EmployeeSalarySummary.tsx`, rendered inside
`EmployeeJourney.tsx` directly below the existing "Registrar Ponto" button.

**Rationale**: Directly specified during `/speckit-clarify` — the user corrected an initial
assumption that this belonged on the HR employee form; it must live on the employee's own
self-service check-in screen. Extracting it into its own component (rather than inlining
into the already ~260-line `EmployeeJourney.tsx`) keeps both files under the practical
150-line ceiling and keeps the new data-fetching logic isolated in its own hook.

**Alternatives considered**: Inlining directly into `EmployeeJourney.tsx` — rejected, would
push an already-large component further past the size discipline principle and mix two
concerns (check-in registration vs. salary reporting) in one file.

## 3. Self-service access to salary/advances/lateness data

**Decision**: Treat this as an explicit, external backend dependency. The frontend is built
against a documented (but not-yet-implemented) self-service contract addition — see
`contracts/employee-self-service-salary.md` — rather than by weakening the existing
permission model.

**Rationale**: `specs/api/employees.md` states plainly: *"Requires: HUMAN_RESOURCES on every
endpoint in this file."* That covers `GET /employees/salary-summary/{employee_id}`,
`GET /employees/salary-advances`, and `GET /employees/lateness-config`. There is also no
documented endpoint anywhere (checked `employees.md`, `users.md`, `auth.md`) that resolves
the currently authenticated user to their own `employee_id` — `GET /users/me` returns only
`id, name, username, roles, active, created_at`, with no employee linkage. An `EMPLOYEE`-only
user genuinely cannot self-serve this data against the contract as documented today. This
was surfaced and resolved during `/speckit-clarify` (Option A): call it out as a prerequisite
rather than silently working around it.

**Alternatives considered**:
- Widen the `HUMAN_RESOURCES` gate to also allow `EMPLOYEE` on all `/employees/*` endpoints
  — rejected: this would let any employee list/edit/delete *every other* employee record and
  read everyone's salary, a serious permission regression far beyond what's needed.
- Have the frontend silently use an HR/admin-privileged call path or embedded credential to
  fetch on the employee's behalf — rejected: insecure, and not how the existing token-based
  auth model (`src/contexts/AuthContext.tsx`) works.
- Block User Story 2 entirely until backend ships — rejected per the clarify session; the
  user wants the frontend built now against an agreed contract, with the dependency tracked
  explicitly (see `plan.md` Constitution Check risk note and `tasks.md` once generated).

## 4. `SalarySummaryResponse` type is missing fields already in the contract

**Decision**: Extend `types/employee.ts`'s `SalarySummaryResponse` to add
`late_delay_minutes`, `late_days_count`, and `late_deduction_total`, matching
`specs/api/employees.md`'s documented response shape.

**Rationale**: The existing type only has `employee_id, month, year, gross_salary,
advances_total, net_salary` — it was written before the lateness fields existed in the
contract (or never updated). FR-007 requires displaying delay minutes, late days, and
deduction total, which the current type can't represent. This is a narrow, contract-accurate
fix, not a redesign.

**Alternatives considered**: None — the fields are already returned by the backend per the
contract; the frontend type simply needs to catch up.

## 5. Mobile responsiveness approach

**Decision**: Tailwind responsive utility classes only (mobile-first stacking: single column
by default, widening at existing breakpoints), verified down to 360px per SC-003 — same
approach already used in `Layout.tsx` (`lg:` breakpoint for the sidebar/hamburger switch).

**Rationale**: No new UI library or CSS approach is justified for what is fundamentally a
stat/summary list; Constitution Principle V disallows new UI-library deviations without
explicit request.

**Alternatives considered**: CSS Grid with container queries — rejected as unnecessary
complexity for a straightforward stacked summary layout.

## 6. Runtime behavior when the backend dependency isn't met yet

**Decision**: If the self-service salary/advances call fails (e.g., `403` while the backend
change is still pending), `EmployeeSalarySummary.tsx` shows an inline
"informação indisponível no momento" message instead of throwing/breaking the screen,
following the existing error-handling pattern already used in `useJourney`/`EmployeeJourney`
(catch → set error string → render inline banner).

**Rationale**: The check-in screen's primary, already-shipped function (registering a
journey) must keep working regardless of whether the new section's backend prerequisite has
landed yet.

**Alternatives considered**: Hiding the section entirely on error — rejected: an inline
message is more debuggable/honest for HR and the employee than a silently missing section.
