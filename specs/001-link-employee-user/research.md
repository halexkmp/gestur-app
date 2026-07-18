# Phase 0 Research: Link Employee to User Account

No open `[NEEDS CLARIFICATION]` markers remain in the spec or Technical Context (the three
scope ambiguities were resolved with the user during `/speckit-specify`). This document
records the implementation-approach decisions made while translating the spec into a plan.

## 1. How to determine "eligible existing user" candidates without a new backend endpoint

**Decision**: Compute eligibility entirely client-side from data already being fetched.
`userService.getAll()` returns `User[]`, each with `roles: Role[]` (`{id, name}`) inline —
no separate `GET /roles` call is needed to filter by role name. Cross-reference against the
already-loaded `employees` list (`HR.tsx` already holds this in state) to exclude any user
whose id appears as another employee's `user_id` (excluding the employee currently being
edited, so its own linked user stays selectable).

**Rationale**: `specs/api/users.md` confirms `User.roles` is a `RoleRef[]` with `name` on every
read endpoint (`GET /users/`, `GET /users/{id}`, `GET /users/me`, `PUT /users/{id}`), so role
filtering needs no extra request. `specs/api/employees.md` confirms `Employee.user_id` is
already present on every employee returned by `GET /employees/`. Both lists are already loaded
by `HR.tsx` today (`employees`) or will be loaded once for the form (`users`), so no backend
change or new endpoint is required — matches the constraint that this is a frontend-only
feature.

**Alternatives considered**: A dedicated `GET /employees/available-users`-style backend
endpoint would be cleaner at scale, but there's no pagination anywhere in this backend and no
indication user counts are large; adding a backend endpoint is out of scope for a frontend-only
feature per the spec's assumptions.

## 2. Handling the `GET /users/` non-admin visibility gap

**Decision**: No special-case detection code. The picker just renders whatever
`userService.getAll()` returns, filtered as in (1). If that yields zero or few candidates
(which is what happens for a non-`ADMIN` HR caller, per `specs/api/shared.md`), the existing
"no eligible users found" empty state (already required by the spec's edge cases) covers it
naturally — HR still gets to create a new account inline.

**Rationale**: Trying to distinguish "genuinely no eligible users" from "you don't have
permission to see them" would require guessing at caller role from the response shape, which
`specs/api/shared.md` doesn't expose (the endpoint silently downgrades, it doesn't error or
flag the downgrade). Building a single honest empty state that always offers the "create new"
fallback handles both cases correctly without needing to detect which one occurred.

**Alternatives considered**: Show a distinct warning message when the caller isn't ADMIN. This
requires access to the current user's role inside the form; `useAuth()` does not expose
`isAdmin` in a way distinguishable from `isSuperAdmin` for this purpose without checking
`user.roles` directly, and no other part of `HR.tsx` does this. Rejected as unnecessary
complexity — the single empty state achieves the same practical outcome.

## 3. Submission sequencing for inline user creation

**Decision**: When HR chooses "create new account," submission does `userService.create(...)`
first, then `employeeService.create(...)`/`employeeService.update(...)` with the returned user's
`id` as `user_id`. If user creation fails (e.g., duplicate username, FR-009), the employee
call is never made and the form stays open with entered values intact. If user creation
succeeds but the subsequent employee call fails (e.g., a race producing a 400/404 on `user_id`,
FR-008), the newly created user account is left in place (unlinked) rather than attempting a
compensating delete — matches FR-006/FR-007's "never delete a user account as a side effect"
principle, applied here to avoid deleting one this flow *just* created due to a downstream
failure.

**Rationale**: `POST /users/` returns 201 with the full created user (id included), so the id
is available synchronously for the follow-up call. `POST /employees/salary-advances` (the only
other multi-step-ish flow in this codebase) doesn't have a comparable two-request pattern to
mirror, so this is a novel sequencing case for this codebase — kept as simple as possible
(two sequential awaited calls, no rollback machinery).

**Alternatives considered**: A backend transaction/single endpoint that creates both atomically
would remove the partial-failure case entirely, but that's a backend change outside this
feature's frontend-only scope.

## 4. Existing-user picker UI pattern

**Decision**: A text input that filters an in-memory list (name/username substring match,
case-insensitive) rendered as a simple dropdown/list of buttons — no new dependency. Matches
the weight of existing `<select>` pickers in `HR.tsx` (e.g., the salary-advance employee
picker) while adding text search since the candidate list, while typically small, is a list of
people's names rather than a short fixed enum.

**Rationale**: Constitution Principle V forbids new UI libraries without explicit request; no
combobox/autocomplete component exists anywhere in this codebase today. A plain filtered list
is the smallest addition consistent with existing patterns.

**Alternatives considered**: A plain `<select>` (like the salary-advance employee picker).
Rejected only because user accounts are identified by both name and username and the list
could plausibly be long enough that scanning a native dropdown is worse UX than typing to
filter — still no new dependency either way, just a different existing-pattern composition.

## 5. Where new types live

**Decision**: Add `CreateUserRequest`/`UpdateUserRequest` to `types/auth.ts`, next to the
existing `User`/`Role`/`TokenResponse` — not a new `types/user.ts`.

**Rationale**: `User`/`Role` already live in `auth.ts` today (not a dedicated `user.ts`,
despite `user` being one of the domain slices CLAUDE.md lists). Moving them as part of this
feature would be an unrelated relocation. Adding the two new request types alongside the
existing ones keeps the change minimal and consistent with Principle V.

**Alternatives considered**: Create `types/user.ts` and move `User`/`Role`/`TokenResponse` into
it for a "proper" domain slice. Rejected as scope creep — a valid future cleanup, but not part
of this feature.
