# Feature Specification: Link Employee to User Account

**Feature Branch**: `[001-link-employee-user]`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "add and improvement on employee component to link the employee to an existent user or creating a new one user. This can be done on create employee or edit it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Link a new employee to an existing user account (Priority: P1)

An HR staff member is registering a new employee who already has a login account in the
system (for example, someone previously created as an operator, or re-hired). While
filling out the "new employee" form, HR searches for and selects that person's existing
user account so the employee record is tied to their existing login from day one.

**Why this priority**: This is the core value of the feature — avoiding duplicate/orphaned
accounts and giving HR a single place to establish the employee-account relationship. It's
the most common linking scenario and delivers value on its own.

**Independent Test**: Can be fully tested by opening "New Employee," searching for an
existing eligible user, selecting it, submitting the form, and confirming the created
employee record shows that user as linked.

**Acceptance Scenarios**:

1. **Given** the new-employee form is open, **When** HR searches the user picker by name
   or username, **Then** matching users with the EMPLOYEE or OPERATOR role who are not
   already linked to another employee are shown as candidates.
2. **Given** HR has selected an existing user in the new-employee form, **When** they
   submit the form, **Then** the employee is created and linked to that user account.
3. **Given** HR has selected an existing user who was linked to another employee moments
   earlier by someone else, **When** they submit the form, **Then** they see a clear error
   explaining the account is already linked to a different employee, and the employee
   record is not created with a broken link.
4. **Given** HR does not want to link any account yet, **When** they submit the new-employee
   form without selecting or creating a user, **Then** the employee is created successfully
   with no linked user.

---

### User Story 2 - Create a new user account while creating an employee (Priority: P1)

An HR staff member is registering a new employee who has never had a login before. Instead
of leaving the HR screen to create a user separately and returning to link it, HR creates
the login account directly from the new-employee form by providing a username and password;
the account is automatically created with employee-level access and linked to the new
employee record in one step.

**Why this priority**: Equally core to the feature — most newly hired employees won't have
a pre-existing account, so inline creation is the common path and removes a multi-step,
error-prone workaround (create user elsewhere, then remember to come back and link it).

**Independent Test**: Can be fully tested by opening "New Employee," choosing to create a
new account, entering a username/password, submitting, and confirming both the employee and
a new user (with employee-level access) exist and are linked to each other.

**Acceptance Scenarios**:

1. **Given** the new-employee form is open, **When** HR chooses to create a new account
   instead of linking an existing one and provides a name, username, and password, **Then**
   submitting the form creates both the employee and a new user account with employee-level
   access, linked together.
2. **Given** HR is creating a new account inline, **When** they enter a username that is
   already taken, **Then** they see a clear error and can correct the username without
   losing the rest of the form's data.
3. **Given** HR is creating a new account inline, **When** they leave the username or
   password blank, **Then** the form prevents submission and indicates those fields are
   required.

---

### User Story 3 - Change or remove an employee's linked user account when editing (Priority: P2)

An HR staff member is editing an existing employee record — for example correcting a data
entry mistake where the wrong account was linked, connecting an account after the fact for
an employee who previously had none, or removing a link entirely (e.g., the employee no
longer needs system access but remains employed).

**Why this priority**: Necessary for correcting mistakes and handling accounts set up after
the employee record already existed, but less frequent than the creation-time flows in
User Story 1 and 2.

**Independent Test**: Can be fully tested by opening "Edit Employee" for an employee with an
existing link, changing the selection to a different eligible user (or clearing it), saving,
and confirming the employee's linked user reflects the change.

**Acceptance Scenarios**:

1. **Given** an employee with no linked user is being edited, **When** HR links an existing
   eligible user or creates a new one (as in User Story 1 / 2) and saves, **Then** the
   employee becomes linked to that user.
2. **Given** an employee already linked to a user is being edited, **When** HR selects a
   different eligible user and saves, **Then** the employee's link is updated to the new
   user.
3. **Given** an employee already linked to a user is being edited, **When** HR clears the
   selection (chooses "no linked account") and saves, **Then** the employee is saved with no
   linked user, and the previously-linked user account itself is not deleted.
4. **Given** HR opens "Edit Employee" for an employee with an existing link, **When** the
   form loads, **Then** the currently linked user is shown pre-selected.

---

### Edge Cases

- What happens when the list of eligible existing users is empty (no unlinked EMPLOYEE/OPERATOR
  accounts)? The picker should communicate that clearly and still let HR create a new account
  inline.
- What happens if the acting HR user lacks permission to view the full list of users? The
  picker must degrade gracefully (e.g., explain that only account creation is available)
  rather than silently showing an incomplete or misleading list.
- How does the system handle submitting the employee form while a duplicate-link conflict
  (the target user got linked elsewhere in the meantime) or a duplicate-username conflict is
  returned — the employee's other field values entered so far must not be lost.
- What happens when an HR user searches for a user who exists but has a role other than
  EMPLOYEE/OPERATOR (e.g., a MANAGER)? That account should not appear as a linkable
  candidate.
- What happens when an employee is deleted — does the linked user account persist? Deleting
  an employee must not delete or otherwise modify the linked user account.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The employee creation form MUST let HR optionally link the new employee to an
  existing user account by searching/selecting from eligible candidates, without requiring a
  link to be made.
- **FR-002**: Eligible candidates for linking MUST be limited to user accounts that (a) have
  the EMPLOYEE or OPERATOR role and (b) are not already linked to a different employee.
- **FR-003**: The employee creation form MUST let HR alternatively create a brand-new user
  account inline (name, username, password) instead of linking an existing one, and the
  newly created account MUST be automatically assigned employee-level access with no role
  selection exposed to HR.
- **FR-004**: On successful submission of the creation form, the new employee record MUST be
  linked to whichever user account was selected or newly created, if any.
- **FR-005**: The employee edit form MUST show the employee's currently linked user account
  (if any) pre-selected, and MUST let HR change the link to a different eligible existing
  user, create and link a brand-new account, or remove the link entirely.
- **FR-006**: Removing an employee's linked-user association MUST NOT delete or modify the
  user account itself — it only clears the association on the employee record.
- **FR-007**: Deleting an employee record MUST NOT delete or modify any user account that was
  linked to it.
- **FR-008**: If HR attempts to link an employee to a user account that has become linked to
  a different employee since the picker was loaded, the system MUST reject the submission
  with a clear, specific error message and MUST preserve the rest of the form's entered
  values so HR can correct just the account selection.
- **FR-009**: If HR attempts to create a new user account inline with a username that is
  already taken, the system MUST reject the submission with a clear, specific error message
  and MUST preserve the rest of the form's entered values.
- **FR-010**: The username and password fields for inline account creation MUST be required
  whenever HR chooses the "create new account" path, and the form MUST NOT allow submission
  with either left blank.
- **FR-011**: The employee list/detail view MUST indicate whether an employee currently has a
  linked user account.

### Key Entities

- **Employee**: A staff member record managed by HR (name, salary, PIX key, active status,
  start date). Gains an optional association to at most one User account.
- **User**: A login/account record (name, username, role(s), active status) usable
  independently of employee records (e.g., admins, managers, operators). At most one Employee
  may reference a given User at a time.
- **Employee-User Link**: The optional one-to-one association between an Employee and a User,
  established or changed at employee creation or edit time, and independently removable
  without deleting either record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: HR can complete new-employee registration with an account (new or linked) in a
  single form submission, with no separate trip to a different screen required.
- **SC-002**: 100% of attempts to link an employee to a user account already linked to a
  different employee are rejected with a clear explanation, and result in zero employees left
  in a broken or ambiguous link state.
- **SC-003**: 100% of attempts to create an inline account with a taken username are rejected
  without losing any other data HR had already entered in the employee form.
- **SC-004**: HR can determine, without opening the edit form, whether a given employee has a
  linked user account, for every employee in the list.
- **SC-005**: Removing or changing an employee's linked user never deletes or alters the user
  account record itself, verified across create, edit, and delete-employee flows.

## Assumptions

- The backend's employee endpoints support an employee-to-user link (`user_id`) with the
  validation rules described in `specs/api/employees.md` (nullable link field, 404 on
  unknown user, 400 on double-link). `specs/api/*.md` is treated as the sole source of
  truth for backend behavior, so this is taken as accurate without further verification.
- New accounts created inline from the employee form are assigned the EMPLOYEE role only,
  with no role picker exposed in that flow; HR can still change a user's roles afterward
  from the existing Users management screen if needed.
- The existing-user picker only offers users with the EMPLOYEE or OPERATOR role as link
  candidates, to reduce the risk of accidentally linking a privileged (ADMIN/MANAGER/HR)
  account to an employee record.
- Per `specs/api/shared.md`, listing all users is restricted to ADMIN callers; any other
  caller only sees themselves. Since employee management requires the HUMAN_RESOURCES role
  (not necessarily ADMIN), this may limit which HR users can browse the full candidate list
  when linking. How to resolve this gap (broaden backend permissions vs. a scoped
  candidate-search endpoint) is a planning-time concern, not a change to this spec's scope.
- Employee deletion behavior (whether it's blocked if a user is linked, or proceeds and just
  drops the association) follows the existing delete behavior already in place; this feature
  does not change what happens to the employee record on delete, only guarantees the linked
  user record is unaffected.
