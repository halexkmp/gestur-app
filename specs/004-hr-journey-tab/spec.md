# Feature Specification: HR Journey Tab

**Feature Branch**: `004-hr-journey-tab`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Add a refactor to turn Manage Journey (Gerencias Jornadas) into a new tab on HR component. This refactor aims the all features related to employee be contextualized. Keep the same permissions about visibility."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage employee journeys from within the HR page (Priority: P1)

An HR/admin user who today opens "Gerenciar Jornadas" as its own menu item instead finds
the same journey (check-in) moderation screen as a tab on the Recursos Humanos (HR) page —
alongside Funcionários, Salário, and Configuração de Atrasos — and can browse, filter, and
review employee check-in records from there.

**Why this priority**: This is the core of the request — consolidating every employee-related
management capability into one contextual place (the HR page) instead of a scattered
top-level menu. Without this, nothing else in the refactor has a home.

**Independent Test**: Log in as a user who could previously access "Gerenciar Jornadas",
confirm it's gone from the top-level menu, open the HR page, confirm a new tab exposes the
same journey list with the same employee/date filters and lateness flagging as before.

**Acceptance Scenarios**:

1. **Given** a user who could access "Gerenciar Jornadas" before this change, **When** they
   open the HR page, **Then** a new tab presents the employee journey (check-in) records,
   with the top-level "Gerenciar Jornadas" menu entry no longer present.
2. **Given** the new tab is open, **When** the user filters by employee and/or date range,
   **Then** the list updates to show only matching journey records, same as the previous
   standalone screen.
3. **Given** a lateness configuration is active and some records are late, **When** the user
   enables "show only delayed", **Then** only late records are shown, consistent with
   existing behavior.
4. **Given** a journey record has an attached selfie, **When** the user opens it, **Then**
   the same selfie viewer behavior as today is available from the new tab.

---

### User Story 2 - Correct a journey record (Priority: P2)

An HR/admin user finds a journey record with inaccurate location or time data and corrects
it, providing a reason for the change, from within the new tab.

**Why this priority**: This is an existing capability (not new) that must not be lost in the
move — but the tab is still useful for browsing/filtering (US1) even before edit is verified.

**Independent Test**: From the new tab, open a record's edit action, change its date/time
and/or coordinates, provide a reason, save, and confirm the record reflects the update.

**Acceptance Scenarios**:

1. **Given** a journey record is selected for editing, **When** the user submits new
   date/time and/or coordinates with a required reason, **Then** the record is updated and
   the list reflects the new values.
2. **Given** the user attempts to save an edit without providing a reason, **When** they
   submit, **Then** the save is blocked until a reason is provided, same as today.

---

### User Story 3 - Remove an incorrect journey record (Priority: P3)

An HR/admin user deletes a journey record that should not exist (e.g., a duplicate or
erroneous check-in), from within the new tab.

**Why this priority**: Also an existing capability to preserve, lower priority than
browsing/editing since it's a less frequent, more destructive action.

**Independent Test**: From the new tab, delete a journey record after confirming the action,
and confirm it no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** a journey record exists, **When** the user chooses to delete it and confirms,
   **Then** the record is removed from the list (soft-deleted), same as today's behavior.
2. **Given** the delete confirmation prompt is shown, **When** the user cancels, **Then** the
   record is not removed.

---

### Edge Cases

- What happens when no journey records match the selected employee/date filters? The tab
  shows an empty-state message, not an error, consistent with today's screen.
- What happens when a record's selfie reference is no longer available? The tab shows the
  same "may have expired" messaging used today, not a broken image.
- A user who could see "Gerenciar Jornadas" before (per the existing, broader-than-backend
  visibility rule) still sees the new tab and can attempt the same actions — this refactor
  does not change who can see or attempt journey moderation, even where that visibility rule
  is already wider than what the underlying actions strictly require.
- All other HR tabs (Funcionários, Salário, Configuração de Atrasos) continue to work
  unchanged — this refactor only adds a tab and removes the old standalone entry point.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST remove "Gerenciar Jornadas" as a standalone top-level
  navigation item.
- **FR-002**: The system MUST add a new tab to the Recursos Humanos (HR) page that provides
  the same employee journey (check-in) moderation capabilities previously found on the
  standalone "Gerenciar Jornadas" page.
- **FR-003**: The new tab MUST be visible to exactly the same set of users who could access
  "Gerenciar Jornadas" before this change — no broadening or narrowing of visibility.
- **FR-004**: The new tab MUST allow filtering journey records by employee and by date range,
  matching existing filter behavior.
- **FR-005**: The new tab MUST display each journey record's employee, date/time, location,
  and selfie photo (when available), matching existing display behavior.
- **FR-006**: When a lateness configuration is active, the new tab MUST continue to support
  flagging and filtering for delayed check-ins, matching existing behavior.
- **FR-007**: The new tab MUST allow editing a journey record's date/time and/or location,
  requiring a reason for the change before saving, matching existing behavior.
- **FR-008**: The new tab MUST allow deleting a journey record after explicit confirmation,
  matching existing behavior.
- **FR-009**: This refactor MUST NOT change the behavior, content, or visibility of the
  existing Funcionários, Salário, or Configuração de Atrasos tabs.
- **FR-010**: This refactor MUST NOT change the separate, self-service "Minha Jornada"
  (employee check-in) experience used by employees to register their own journeys — that
  remains outside the HR page, unaffected.

### Key Entities

- **Journey Record**: An existing check-in record (employee, timestamp, coordinates,
  optional selfie) — unchanged by this refactor, only its management surface moves.
- **Lateness Configuration**: The existing system-wide configuration already surfaced
  elsewhere in HR — reused here only for the existing delayed-record flagging/filtering
  behavior, not changed by this refactor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every task previously possible from the standalone "Gerenciar Jornadas" page
  (search/filter, view details and selfie, edit with reason, delete with confirmation) is
  possible from the new HR tab, with zero loss of capability.
- **SC-002**: The top-level navigation menu has one fewer entry after this change, with no
  reduction in what any user can ultimately do.
- **SC-003**: A user who could not access journey moderation before this change still cannot
  access it afterward — visibility is unchanged for 100% of the existing user population.
- **SC-004**: All employee-related management capabilities (employee records, salary, lateness
  configuration, journey moderation) are reachable from a single HR page context, without
  navigating to a separate top-level section.

## Assumptions

- "Contextualized" is interpreted as consolidating the existing "Gerenciar Jornadas"
  functionality into a new HR tab — this refactor does not add new journey-moderation
  capabilities beyond what already exists today.
- The self-service "Minha Jornada" page (where employees register their own check-ins) is
  explicitly out of scope: the request names "Manage Journey (Gerenciar Jornadas)", which is
  the admin/HR-facing moderation screen, not the employee self-service one.
- The visibility rule to preserve is the one currently governing the standalone "Gerenciar
  Jornadas" menu entry (Super Admin or Human Resources), even though the underlying backend
  actions are more narrowly restricted (Admin-only) — the user's explicit instruction to
  "keep the same permissions about visibility" is read as "don't change today's visibility
  behavior as part of this refactor," not as an invitation to newly align it with the
  backend's stricter rule.
- No backend changes are required: the existing journey-moderation endpoints already support
  everything the current standalone screen does — see the API Contract Check notes.
- Where exactly the new tab sits among the existing HR tabs is left as an implementation
  detail for planning, not specified by the request.
