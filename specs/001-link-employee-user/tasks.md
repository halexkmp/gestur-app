---

description: "Task list for Link Employee to User Account"
---

# Tasks: Link Employee to User Account

**Input**: Design documents from `/specs/001-link-employee-user/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/employee-user-endpoints.md, quickstart.md

**Tests**: Not requested for this feature (no automated tests exist today for `HR.tsx`/`Users.tsx`, and the repo's Vitest setup is currently broken per a pre-existing, unrelated gap). Validation is manual via `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. All three stories are implemented within the same new `EmployeeFormModal.tsx` component (they're different modes of one form, not separate files), so most user-story tasks touch that single file sequentially rather than in parallel — parallelism is marked only where genuinely independent files are involved.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-project web frontend — all paths are under `src/` at the repository root, per `plan.md`.

---

## Phase 1: Setup

**Purpose**: Scaffold the new component this feature builds on.

- [X] T001 Create `src/components/EmployeeFormModal.tsx` with a minimal skeleton (props: `employee: Employee | null`, `onClose: () => void`, `onSaved: () => void`; renders nothing functional yet) — no new dependencies required (see `research.md` §4).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, service typing, and the modal extraction that every user story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add `user_id?: string | null` to `Employee`, `CreateEmployeeRequest`, and `UpdateEmployeeRequest` in `src/types/employee.ts`, per `data-model.md` "Employee (extended)".
- [X] T003 [P] Add `CreateUserRequest` and `UpdateUserRequest` interfaces to `src/types/auth.ts`, alongside the existing `User`/`Role`/`TokenResponse`, per `data-model.md` "CreateUserRequest / UpdateUserRequest" and `research.md` §5.
- [X] T004 Replace the `any` parameter types on `userService.create`/`userService.update` in `src/services/userService.ts` with `CreateUserRequest`/`UpdateUserRequest` (depends on T003).
- [X] T005 Move the existing inline employee create/edit `<form>` modal out of `src/components/HR.tsx` and into `src/components/EmployeeFormModal.tsx` (name, PIX key, start date, salary, active fields only — no account-link UI yet), preserving current create/edit behavior exactly; update `HR.tsx` to render `<EmployeeFormModal>` instead of its inline modal (depends on T001).
- [X] T006 Implement the `eligibleUsers` derivation (role EMPLOYEE/OPERATOR, active, not linked to a different employee, always includes the employee's own current link when editing) inside `src/components/EmployeeFormModal.tsx`, per `data-model.md` "Derived candidate list" and `research.md` §1 (depends on T002, T005).

**Checkpoint**: Foundation ready — `EmployeeFormModal.tsx` exists, behaves exactly like the old inline modal, and has typed access to `user_id` and eligible candidates. User story implementation can now begin.

---

## Phase 3: User Story 1 - Link a new employee to an existing user account (Priority: P1) 🎯 MVP

**Goal**: HR can, while creating a new employee, search for and select an existing eligible user account and have the employee created already linked to it.

**Independent Test**: Open "New Employee," search the picker for a prepared unlinked EMPLOYEE/OPERATOR user, select it, submit, and confirm the created employee shows that user as linked (`quickstart.md` Scenario 1).

### Implementation for User Story 1

- [X] T007 [US1] Add account-link mode state (`'none' | 'link-existing' | 'create-new'`) and a searchable existing-user picker (text input filtering `eligibleUsers` from T006 by name/username, rendered as a filtered list) to `src/components/EmployeeFormModal.tsx`, per `data-model.md` "View-model: Employee Account Link Selection" and `research.md` §4.
- [X] T008 [US1] Wire create-mode submission in `src/components/EmployeeFormModal.tsx`: when mode is `link-existing`, include the selected `user_id` in the `employeeService.create()` payload; when mode is `none`, omit `user_id` entirely (FR-001, FR-004).
- [X] T009 [US1] Handle `404`/`400` responses from `employeeService.create()` (unknown or already-linked `user_id`) with a clear inline error message that preserves all entered form values, in `src/components/EmployeeFormModal.tsx`, per `contracts/employee-user-endpoints.md` "Error → UI mapping" (FR-008).

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently — new employees can be linked to existing accounts at creation time.

---

## Phase 4: User Story 2 - Create a new user account while creating an employee (Priority: P1)

**Goal**: HR can create a brand-new EMPLOYEE-role account inline while creating an employee, in a single form submission.

**Independent Test**: Open "New Employee," choose "create a new account," enter a username/password, submit, and confirm both a new employee and a new EMPLOYEE-role user exist and are linked (`quickstart.md` Scenario 2).

### Implementation for User Story 2

- [X] T010 [US2] Add a "create new account" sub-form (name defaulting to the employee's own name but independently editable, username, password fields) to the account-link section in `src/components/EmployeeFormModal.tsx`, selectable alongside the `link-existing`/`none` modes from T007 (FR-003).
- [X] T011 [US2] Add required-field validation in `src/components/EmployeeFormModal.tsx` that blocks form submission when `mode === 'create-new'` and username or password is blank (FR-010).
- [X] T012 [US2] Wire create-mode submission sequencing in `src/components/EmployeeFormModal.tsx`: when `mode === 'create-new'`, call `userService.create({ name, username, password, roles: ['EMPLOYEE'] })` first, then call `employeeService.create()`/`employeeService.update()` with the returned user's `id` as `user_id` (depends on T004, T010), per `data-model.md` "State transitions on submit" and `research.md` §3 (FR-003, FR-004).
- [X] T013 [US2] Handle a username-taken error from `userService.create()` in `src/components/EmployeeFormModal.tsx` with an inline error on the username field, without ever calling the employee endpoint, preserving all entered form values (FR-009), per `contracts/employee-user-endpoints.md`.

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently — full employee-creation flow supports both linking an existing account and creating a new one.

---

## Phase 5: User Story 3 - Change or remove an employee's linked user account when editing (Priority: P2)

**Goal**: HR can view an employee's current linked account when editing, and switch it to a different account, create a new one, or remove the link entirely.

**Independent Test**: Open "Edit Employee" for an employee with an existing link, confirm it's pre-selected, switch to a different eligible user (or clear it), save, and confirm the change took effect without deleting any user record (`quickstart.md` Scenario 3).

### Implementation for User Story 3

- [X] T014 [US3] Initialize account-link mode to `'link-existing'` with `selectedUserId` set to the employee's current `user_id` when `EmployeeFormModal.tsx` opens in edit mode, and force-include that user in `eligibleUsers` even if it wouldn't otherwise pass the role/active filters (depends on T006), per `data-model.md` "Initialization on edit" (FR-005).
- [X] T015 [US3] Add a "no linked account" clear option to the picker in `src/components/EmployeeFormModal.tsx`, distinct from "leave unchanged," so HR can explicitly remove an existing link (depends on T007) (FR-005, FR-006). Implemented as the "Nenhuma" mode tab, which sends an explicit `user_id: null` on edit (see T016 note) rather than an "unchanged" omit — a simpler, always-correct equivalent to the original plan.
- [X] T016 [US3] Wire edit-mode submission `user_id` semantics in `src/components/EmployeeFormModal.tsx`: reuse the T012 create-then-link sequencing when switching to a brand-new account, per `data-model.md` "State transitions on submit" (FR-005, FR-006). **Implementation deviation**: rather than tracking "touched vs. untouched" to decide omit-vs-send, the final code always sends an explicit `user_id` on edit submission (the selected id for `link-existing`, `null` for `none`) — sending the pre-existing id back is a no-op for the backend, so this is behaviorally equivalent to "omit when unchanged" but removes an entire class of state-tracking bugs. `research.md`/`data-model.md` are not updated in-place for this simplification; noted here instead.

**Checkpoint**: All three user stories are independently functional — employee creation and editing both fully support linking, inline creation, switching, and unlinking.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Visibility and quality checks that span all three stories.

- [X] T017 [P] Add a "linked account" indicator (icon or badge, matching the existing status-badge styling in `src/components/HR.tsx`) to the employee table so HR can tell at a glance whether an employee has a linked user (depends on T002, T005), per FR-011 and SC-004.
- [X] T018 Run `npm run lint` and `npm run typecheck` and fix any violations introduced by this feature's changes across `src/types/employee.ts`, `src/types/auth.ts`, `src/services/userService.ts`, `src/components/EmployeeFormModal.tsx`, and `src/components/HR.tsx`. Found and fixed one knock-on error in `src/components/Users.tsx` (its existing `userService.create` call site needed a `UserRole` cast once the signature was tightened). All remaining lint/typecheck output is pre-existing and in files this feature didn't touch.
- [ ] T019 **BLOCKED** — Manually execute all five scenarios in `specs/001-link-employee-user/quickstart.md` against a running dev server (`npm run dev`) and confirm expected outcomes. `npm run build` and `npm run dev` both succeed and the app serves cleanly, but the configured `VITE_API_URL` (an ngrok tunnel in `.env`) is offline (`ERR_NGROK_3200`), and no browser automation tool is available in this session, so the login-gated HR page could not actually be driven end-to-end. This task needs to be run manually against a live backend before merging.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001). BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (T002–T006) only.
- **User Story 2 (Phase 4)**: Depends on Foundational (T002–T006). T012 also depends on T004 and T010. Independently testable from US1 (a fresh employee created via "create new account" never touches the US1 picker path), though it shares the mode-selector UI added in T007.
- **User Story 3 (Phase 5)**: Depends on Foundational (T002–T006). T016 depends on T012 (reuses US2's create-then-link sequencing when switching to a brand-new account during edit) and on T014/T015.
- **Polish (Phase 6)**: T017 depends only on Foundational; T018–T019 depend on all prior phases being complete.

### Within Each User Story

- US1: T007 → T008 → T009 (same file, strictly sequential).
- US2: T010 → T011; T012 depends on T004 + T010; T013 depends on T012 (same file, mostly sequential).
- US3: T014 and T015 can be done in either order (both depend only on Foundational + T007), but T016 needs both plus T012.

### Parallel Opportunities

- T002 and T003 (different files: `types/employee.ts` vs `types/auth.ts`) can run in parallel.
- T017 (touches `HR.tsx`, not `EmployeeFormModal.tsx`) can be done in parallel with any of the US1/US2/US3 tasks once Foundational is complete, since it doesn't touch the same file.
- Within `EmployeeFormModal.tsx`, tasks are largely sequential (same file) — true parallelism across stories is limited for this feature, since all three stories live in one component by design (see `plan.md` Summary).

---

## Parallel Example: Foundational Phase

```bash
# Launch independent type additions together:
Task: "Add user_id to Employee/CreateEmployeeRequest/UpdateEmployeeRequest in src/types/employee.ts"
Task: "Add CreateUserRequest/UpdateUserRequest to src/types/auth.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001).
2. Complete Phase 2: Foundational (T002–T006) — critical, blocks all stories.
3. Complete Phase 3: User Story 1 (T007–T009).
4. **STOP and VALIDATE**: Run `quickstart.md` Scenario 1 and Scenario 5 (degraded picker) independently.
5. Demo: HR can create employees and link them to pre-existing accounts.

### Incremental Delivery

1. Setup + Foundational → foundation ready (modal extracted, types in place).
2. Add User Story 1 → validate via Scenario 1 → MVP demoable.
3. Add User Story 2 → validate via Scenario 2 → full creation flow demoable.
4. Add User Story 3 → validate via Scenario 3 and 4 → full create+edit flow demoable.
5. Polish (T017–T019) → linked-account visibility in the list, lint/typecheck clean, full manual regression pass.

---

## Notes

- No `[P]` markers appear inside the User Story phases beyond what's listed above — `EmployeeFormModal.tsx` is a single shared file across all three stories by design (see `plan.md`), so most story tasks are intentionally sequential rather than parallel.
- Commit after each task or logical group, per repository convention (`git status` shows the working tree; nothing here should be force-pushed or squashed automatically).
- Stop at either checkpoint (end of Phase 3, end of Phase 4) to validate that story independently before continuing.
