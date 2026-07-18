# Phase 1 Data Model: Link Employee to User Account

## Employee (extended)

Existing entity (`types/employee.ts`), gaining one field. Matches `specs/api/employees.md`.

```text
Employee
├── id: string
├── name: string
├── salary: number
├── pix_key?: string | null
├── active: boolean
├── start_date?: string | null
└── user_id?: string | null   # NEW — id of the linked User, or null/absent if none
```

```text
CreateEmployeeRequest
├── name: string
├── pix_key?: string | null
├── salary: number
├── active?: boolean
├── start_date?: string | null
└── user_id?: string | null   # NEW — optional; omit for no link, or a User.id to link at creation

UpdateEmployeeRequest (all optional / partial)
├── name?: string
├── pix_key?: string | null
├── salary?: number
├── active?: boolean
├── start_date?: string | null
└── user_id?: string | null
    # NEW — three distinct states on submit:
    #   omitted   → leave the existing link unchanged
    #   "<uuid>"  → set/replace the link
    #   null      → explicitly clear the link
```

**Validation rules** (enforced by the backend per `specs/api/employees.md`; the frontend must
surface these as form errors, not swallow them):
- Referencing a `user_id` that doesn't exist → `404 Not Found`.
- Referencing a `user_id` already linked to a different employee → `400 Bad Request`
  (FR-008).

## User (unchanged)

Existing entity (`types/auth.ts`). No shape changes — consumed as-is for the picker and for
displaying the newly-created account.

```text
User
├── id: string
├── name: string
├── username: string
├── roles: Role[]        # {id, name} — used client-side to filter EMPLOYEE/OPERATOR candidates
├── active: boolean
└── created_at: string
```

## CreateUserRequest / UpdateUserRequest (new types)

Currently `userService.create`/`update` accept `any`. This feature adds proper types
(`types/auth.ts`) matching `specs/api/users.md`, since the inline-creation flow needs to
construct this payload correctly:

```text
CreateUserRequest
├── name: string
├── username: string
├── password: string
└── roles: string[]      # role NAMES, e.g. ["EMPLOYEE"] — matches Create User's documented
                          # shape (UserRole[] as plain strings), NOT {id, name} objects

UpdateUserRequest (all optional / partial)
├── name?: string
├── username?: string
├── password?: string
├── roles?: { id: string }[]   # role IDs — different shape from Create, per specs/api/users.md
└── active?: boolean
```

This feature only exercises `CreateUserRequest` (inline account creation, always
`roles: ['EMPLOYEE']`, FR-003). `UpdateUserRequest` is added for type-safety completeness of
`userService.update` (removing the existing `any`) but this feature does not call it.

## View-model: Employee Account Link Selection

Not persisted — local form state inside `EmployeeFormModal.tsx`, describing which of the
three account-link modes (FR-001/003/005) is active:

```text
AccountLinkMode = 'none' | 'link-existing' | 'create-new'

EmployeeFormAccountState
├── mode: AccountLinkMode
├── selectedUserId?: string        # set when mode === 'link-existing'
├── userSearchQuery: string        # filters the candidate list, mode === 'link-existing'
└── newUser: { name: string; username: string; password: string }
                                    # populated when mode === 'create-new'; name defaults to
                                    # the employee's own `name` field but is independently editable
```

**Initialization on edit** (FR-005 "pre-selected"): if the employee being edited has a
`user_id`, `mode` initializes to `'link-existing'` with `selectedUserId` set to that id, and
that user is force-included in the candidate list even if it wouldn't otherwise pass the
EMPLOYEE/OPERATOR role filter (so editing an employee never appears to silently drop an
existing, valid link due to a role edge case).

**Derived candidate list** (see `research.md` §1):

```text
eligibleUsers = users.filter(u =>
  u.roles.some(r => r.name === 'EMPLOYEE' || r.name === 'OPERATOR') &&
  u.active &&
  (
    !employees.some(e => e.user_id === u.id && e.id !== currentEmployeeId) ||
    u.id === currentEmployeeInitialUserId   // never exclude the employee's own current link
  )
).filter(u => matchesSearch(u, userSearchQuery))
```

## State transitions on submit

```text
mode === 'none'          → user_id omitted (create) / omitted (update, link unchanged)
                            — edit-only exception: if clearing a previously-set link,
                            explicitly send user_id: null (FR-005 "remove the link entirely")
mode === 'link-existing'  → user_id: selectedUserId
mode === 'create-new'     → 1) userService.create({ name, username, password, roles: ['EMPLOYEE'] })
                            2) user_id: <id of the user created in step 1>
```
