# Contract: `src/lib/api.ts` error status code

The one shared-file change in this feature. Documented separately from the hook contracts
below because every service in the app depends on `lib/api.ts`, so its behavior needs a
stable, explicit target independent of this feature's own hooks.

## Current behavior (unchanged parts)

- `request<T>` still throws a plain `Error` on any non-2xx response other than the existing
  401 special-case (which still clears the token and redirects to `/login`).
- `error.message` still resolves to the backend's `detail` field when present, falling back to
  `'An error occurred'` — every existing `catch (err) { err instanceof Error ? err.message : ... }`
  call site across the app keeps working unmodified.
- 204 responses still resolve to `{} as T`.

## New behavior

- The thrown error is an instance of a new, exported `ApiError extends Error` with an
  additional `status: number` field set to `response.status`.
- `ApiError` is exported from `src/lib/api.ts` so services can `import { ApiError } from '../lib/api'`
  and narrow on `err instanceof ApiError && err.status === 404`.
- No other exported shape of `api.get/post/put/patch/delete` changes — same generic signatures,
  same params handling, same FormData passthrough.

## Consumer example (this feature's only consumer today)

```ts
// employeeService.ts
getSchedule: async (employee_id: string): Promise<EmployeeWeeklySchedule | null> => {
  try {
    return await api.get<EmployeeWeeklySchedule>(`/employees/schedule/${employee_id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
},
```

## Non-goals

- Does not change how the 401 case behaves (still redirects immediately, doesn't reach the
  generic error path).
- Does not retroactively update other services to use `ApiError` — no other current call site
  needs the status code; this is additive, not a required migration.

## Test coverage (`src/lib/api.test.ts`, new)

- A non-2xx response with a `detail` body throws an `ApiError` whose `.message` equals that
  `detail` and whose `.status` equals the response's status code.
- A non-2xx response with an unparsable body throws an `ApiError` with the fallback message
  and the correct `.status`.
- A 204 response still resolves to `{}`, not an error.
- A 401 response still clears `localStorage.auth_token` and redirects, exactly as before.
