# Phase 0 Research: Employee Advance History View

All Technical Context items were resolvable from the existing codebase and a direct check
against the running local backend. No items remain marked `NEEDS CLARIFICATION`.

## 1. Does the existing advance-listing endpoint return complete history when unfiltered?

**Decision**: Yes, confirmed. `GET /employees/salary-advances?employee_id={uuid}` with
`month`/`year` omitted returns every advance ever recorded for that employee, across all
months — not just the current month.

**Rationale**: `specs/api/employees.md` states all query params on this endpoint are
"optional filters" but only documents the *self-service* sibling
(`GET /employees/me/salary-advances`) as explicitly returning "all of the caller's own
advances" when both are omitted. Rather than assume the HR-facing form behaves identically by
symmetry, this was verified directly: with a real local backend running, an advance was
created dated in March 2026 for an employee who already had a July 2026 advance. Calling the
endpoint with only `employee_id` returned both entries; calling it with `month=7&year=2026`
returned only the July one. This is a direct, verified confirmation, not an inference — see
`plan.md` Summary for the exact commands. No new or modified backend endpoint is needed.

**Alternatives considered**: Build a new bulk/aggregating frontend routine that fetches every
month individually and merges results client-side — rejected outright once the single
unfiltered call was confirmed to already do this server-side; would have been unnecessary
complexity and N monthly requests for no reason.

## 2. Which existing type models the response, and does it need to change?

**Decision**: Reuse the existing `SalaryAdvance` type (`types/employee.ts`) as-is — no new
type needed.

**Rationale**: This endpoint's list-item shape (`id, employee_id, amount, advance_date, note,
created_at`) already matches `SalaryAdvance` exactly. This isn't a fresh assumption: the
prior feature (`006-salary-bulk-summary`) independently re-verified this exact type against
the backend's live OpenAPI schema (`list_salary_advances`'s
`app__slices__employees__list_salary_advances__ui__schemas__SalaryAdvanceItem`) and found it
matches field-for-field, distinct from the *narrower* embedded shape used by the bulk
salary-summary endpoint (`SalarySummaryOverviewAdvance`, which lacks `employee_id`/
`created_at`). This feature's endpoint is the standalone listing, which returns the full
shape.

**Alternatives considered**: None — the type already exists and already fits.

## 3. Where does the "Ver histórico completo" entry point live, and what triggers the fetch?

**Decision**: A small text-button inside `EmployeePaycheckDetail.tsx`'s existing
"Adiantamentos do período" section, below the period-scoped advances list. Clicking it calls
an `onViewHistory` callback threaded down from `SalaryTab.tsx` (through
`EmployeePaycheckRow.tsx`), which sets which employee's history modal is open.
`EmployeeAdvanceHistoryModal` then mounts fresh for that employee and fetches on mount via
`useEmployeeAdvanceHistory(employeeId)` — no manual `load()` trigger needed, since the
modal's very existence (conditionally rendered only while an employee is selected) is already
the trigger, unlike `useEmployeeSchedule` which stays mounted across different employees in a
form and needs an explicit reload.

**Rationale**: This placement was chosen interactively with the user (see `spec.md`'s Input
note) over three alternatives (Funcionários tab row action, both tabs, or a new dedicated
employee-detail page) specifically because it's contextually relevant — HR is already
reviewing that employee's pay when they'd want the full history — and requires no new
navigation concept.

**Alternatives considered**: (documented in `spec.md`'s Input, decided before this plan) —
Funcionários tab action icon, dual entry points in both tabs, and a dedicated employee-detail
page were all considered and set aside by the user in favor of the single Salário-tab entry
point.

## 4. Modal visual pattern

**Decision**: Reuse `Reports.tsx`'s "sale details" modal structure exactly: `fixed inset-0
bg-black bg-opacity-50 ... z-50` overlay, a `bg-white rounded-xl shadow-xl` card with a
header row (title + subtitle on the left, an `X` icon close button on the right in a
`hover:bg-gray-200 rounded-full` button), and a scrollable body (`overflow-y-auto flex-1`)
capped at `max-h-[90vh]`.

**Rationale**: This is the only existing "read-only detail viewer" modal pattern in the
codebase (as opposed to `EmployeeFormModal.tsx`'s form-with-Cancel-button pattern, which is
for editing, not viewing). Matching it exactly satisfies Constitution Principle V and gives
this feature the scrollable-body behavior needed for spec SC-003 (remains usable for a large
number of advances) for free, without inventing new CSS.

**Alternatives considered**: A form-modal-style Cancel button footer (like
`EmployeeFormModal.tsx`) — rejected, since this view has no action to confirm/cancel, only to
close; an `X` header button is the correct affordance for a pure viewer, matching
`Reports.tsx`'s precedent.

## 5. Sort order and total computation

**Decision**: Sort by `advance_date` descending (most recent first) in the hook, immediately
after fetching; compute the total as the sum of every returned advance's `amount`, also in
the hook, exposed alongside `advances`.

**Rationale**: Spec FR-003/FR-004 require most-recent-first ordering and an automatic total.
Doing this in the hook (not the component) matches Constitution's hooks-own-state-
orchestration principle and the precedent already set by `useWorkSchedule.ts`'s derived
`unjustifiedAbsenceCount`. The backend's own documented order is merely "a stable but
unspecified order" for the bulk endpoint's `advances` (per `specs/api/employees.md`) and isn't
documented at all for the standalone listing endpoint used here — so the frontend cannot rely
on server-side ordering and must sort client-side regardless.

**Alternatives considered**: Ask the backend team to guarantee sort order — rejected as
unnecessary scope: sorting ~a page of already-fetched items client-side is trivial and needs
no new backend behavior.
