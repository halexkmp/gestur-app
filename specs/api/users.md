# Users API

## Endpoints

GET /users/

Note: only `ADMIN` gets the full list; any other caller gets a single-item array containing only themselves.

POST /users/ → 201

GET /users/me

GET /users/{user_id}

PUT /users/{user_id}

DELETE /users/{user_id} → 204

---

## User

```text
id
name
username
roles: RoleRef[]   # { id, name }
active
created_at
```

Returned by GET /users/me, GET /users/, GET /users/{id}, PUT /users/{id}.

---

## Create User

Request:

```text
name
username
password
roles: UserRole[]   # role names, default [OPERATOR]
```

Response (POST /users/): same as User above, **except** `roles` is `UserRole[]` (plain
role-name strings), not the `{id, name}` object list every other endpoint returns.

---

## Update User

PUT /users/{user_id}. Any field is optional (partial update).

```text
name
username
password
roles: { id }[]   # role IDs, NOT role-name strings — different from Create User
active
```

Response: User shape above.