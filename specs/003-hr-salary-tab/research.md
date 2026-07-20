# Phase 0 Research: HR Salary Tab

No `[NEEDS CLARIFICATION]` markers were carried over from `spec.md` (the spec's Assumptions
section already resolved every open scope question). Research here instead covers the
technical decisions needed to execute the plan.

## Decision: Compose the per-employee paycheck list client-side via parallel per-employee calls

**Decision**: `useEmployeePaychecks` fetches the active employee list (`GET /employees/?active=true`)
and then issues one `GET /employees/salary-summary/{employee_id}` per active employee in
parallel via `Promise.all`, zipping the results into `EmployeePaycheck[]`.

**Rationale**: Per `specs/api/employees.md`, there is no bulk/batch salary-summary endpoint —
only the single-employee `GET /employees/salary-summary/{employee_id}` and the self-service
`GET /employees/me/salary-summary`. The spec (FR-002) requires showing every active
employee's paycheck by default without a selection step, so the frontend must assemble that
list itself. Employee rosters in this app are small (tens of employees per company, per the
existing UI's unpaginated employee table), so N parallel requests is an acceptable trade-off
with no perceptible latency cost, and matches how `GET /employees/` itself already returns
the full unpaginated set (per `specs/api/shared.md`, no endpoint supports pagination).

**Alternatives considered**:
- *Sequential fetch loop*: rejected — same request count as parallel but strictly slower,
  with no benefit (no rate-limit concern documented in the API contract).
- *Request a backend batch endpoint as a prerequisite*: rejected — out of scope per the spec's
  Assumptions ("No backend changes are required"); would block this frontend-only feature on
  backend work not requested by the user.
- *Fetch summaries lazily, only when a row is expanded*: rejected — this would make the
  default view (FR-002, SC-001) show employees without their gross/net figures at first
  paint, i.e. an incomplete "at a glance" table, which contradicts the stated purpose of the
  tab ("show the current payment check for each employee").

## Decision: Reuse the existing `EmployeeSalarySummary` card visual language, not a new design

**Decision**: The paycheck row/detail UI reuses the same icon set, color coding (blue=gross,
orange=advances, red=lateness, green=net), `R$ X.XX` formatting, and pt-BR month-name
formatting already implemented in `src/components/Journey/EmployeeSalarySummary.tsx`.

**Rationale**: Constitution Principle V (Consistency Over Novelty) directs reusing existing
patterns over inventing new ones. This component already solves "display one employee's
gross/advances/lateness/net for a period" — the HR tab's per-row/per-employee display is the
same problem, just repeated across employees and paired with management actions (add/delete
advance) the self-service view doesn't have. The user's request to apply "UX design best
practices" is best served here by consistency (same visual meaning across the app for the
same data) rather than a divergent new look for a single tab.

**Alternatives considered**:
- *Design a new, distinct visual treatment for the HR paycheck table*: rejected — would
  create two different visual languages for the same underlying concept (an employee's
  salary breakdown) shown to different roles, increasing cognitive load and violating
  Principle V without a stated requirement driving the divergence.

## Decision: Progressive disclosure — table by default, itemized detail on demand

**Decision**: The default tab view is a compact table (one row per active employee: name,
gross, advances discount, lateness discount, net). Itemized salary advances and lateness
detail (User Story 2) are revealed by expanding a row (accordion-style, in place) rather than
navigating to a separate screen or always rendering all detail inline.

**Rationale**: Applies standard UX best practice (progressive disclosure) to reconcile two
requirements that would otherwise conflict: FR-002 (show every employee's paycheck by default,
scannable at a glance) and FR-005/FR-006 (itemized advances + lateness detail available per
employee). Rendering full itemization for every employee by default would reproduce the old
"always-expanded" layout and defeat the at-a-glance goal (SC-001); requiring navigation to a
separate page to see detail would violate Constitution Principle V ("prefer extending existing
screens... a new page is added only when explicitly requested" — not requested here).

**Alternatives considered**:
- *Separate detail page per employee*: rejected — introduces a new page not requested by the
  user, and adds a navigation round-trip the spec's SC-004 ("within a single
  click/interaction beyond opening the tab") argues against.
- *Modal dialog for detail*: considered viable but rejected in favor of inline expand —
  inline keeps the surrounding table (and the ability to compare against other employees)
  visible while inspecting one employee's detail, which a modal would obscure.

## Decision: Keep "new advance" as a secondary, explicit action rather than an always-open form

**Decision**: The new-advance form (User Story 3) is reachable via a clearly labeled action
(e.g., a button opening an inline panel/row), not rendered open by default above the table as
it is in the current `HR.tsx` "Adiantamentos" tab.

**Rationale**: The tab's stated purpose changed from "log advances" to "show the current
payment check" (spec Input). An always-open creation form competing for the top of the screen
works against that new primary purpose and against SC-001 (paycheck visible with no
interaction). Best-practice form design defers data-entry UI until the user expresses intent
to create something, keeping the default view read-oriented, matching the tab's new purpose.

**Alternatives considered**:
- *Keep the form always open, above the table (current behavior)*: rejected — this is
  exactly the "advances-first" framing the request asks to move away from.
