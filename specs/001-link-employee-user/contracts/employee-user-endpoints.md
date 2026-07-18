# Contracts: Employee ↔ User Linking

This feature adds no new backend endpoints and changes no existing ones — it's a frontend
consumer of endpoints already documented in `specs/api/employees.md` and `specs/api/users.md`
(the sole source of truth for backend behavior). This file exists to pin down, in one place,
exactly which of those endpoints/shapes this feature relies on and how errors map to UI
behavior, so implementation doesn't have to cross-reference three files.

## Endpoints consumed

| Endpoint | Used for | Notes |
|---|---|---|
| `GET /employees/` | Loading the employee list, incl. each employee's `user_id` for the "linked account" indicator (FR-011) | Already called by `HR.tsx` today |
| `GET /users/` | Loading candidates for the existing-user picker | Non-admin callers get only themselves — see `research.md` §2 |
| `POST /users/` | Inline new-account creation (FR-003) | Returns 201 with the created `User` (role names as plain strings in the response body, but that doesn't matter here — we only need the returned `id`) |
| `POST /employees/` | Creating the employee, with `user_id` set from the link/create flow | |
| `PUT /employees/{employee_id}` | Editing the employee, incl. changing/clearing `user_id` | |

No `GET /roles` call is needed — see `research.md` §1.

## Error → UI mapping

| Backend response | When it happens | Required UI behavior |
|---|---|---|
| `POST/PUT /employees/*` → `404` | `user_id` doesn't exist (stale picker state) | Reject submission, show a clear "account no longer exists" message, keep form values (FR-008) |
| `POST/PUT /employees/*` → `400` | `user_id` already linked to a different employee (race) | Reject submission, show a clear "account already linked to another employee" message, keep form values (FR-008) |
| `POST /users/` → `422`/`400` (username taken) | Username collision during inline creation | Reject submission before ever calling the employee endpoint; show error next to the username field, keep all form values including the in-progress new-user fields (FR-009) |

`specs/api/shared.md`'s standard 422 validation error shape (`{"detail": [{"loc", "msg",
"type"}]}`) applies to both `/employees/*` and `/users/*` — surface `msg` per offending field
where the `loc` maps to a form field (e.g., `username`), otherwise show a generic error.

## Request payload shapes actually sent

See `data-model.md` "State transitions on submit" for the exact `user_id` value per mode. No
other fields on `CreateEmployeeRequest`/`UpdateEmployeeRequest` change from their current
shape.
