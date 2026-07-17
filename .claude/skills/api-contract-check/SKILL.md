---
name: "api-contract-check"
description: "Cross-check the backend API contract docs in specs/api/ against back-end-openapi.json and surface endpoints, shapes, and quirks relevant to a new feature. Runs automatically as a before_specify hook, or invoke directly."
argument-hint: "Feature description (optional — defaults to the current /speckit-specify input)"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

If empty, use the feature description already in play for this conversation (e.g. the
text passed to `/speckit-specify` that triggered this hook).

## Purpose

`specs/api/*.md` is the hand-written contract for the separate backend service consumed
via `VITE_API_URL`. It is a companion to (and simplification of) `back-end-openapi.json`,
and it also records real behavioral quirks the OpenAPI schema doesn't capture (fields that
are write-only, endpoints with inconsistent shapes, silent permission downgrades, etc.).
Because it's hand-maintained, it can drift from the actual backend. This skill does two
things every time a new feature is specified:

1. **Sync check** — confirm the contract docs still match `back-end-openapi.json`.
2. **Relevance scan** — surface the parts of the contract that matter for the feature
   being specified, so the spec doesn't contradict or duplicate backend behavior.

## Steps

1. **Locate the contract**. The files live in `specs/api/`:
   `auth.md`, `employees.md`, `journey.md`, `loans.md`, `partners.md`, `products.md`,
   `reports.md`, `roles.md`, `sales.md`, `shared.md`, `users.md`.

   If `specs/api/` doesn't exist or is empty, report that no API contract is available
   and stop — don't block the caller, just note the gap.

2. **Sync check against `back-end-openapi.json`** (repo root):
   - Read the OpenAPI file's `paths` keys.
   - For each `specs/api/*.md` file, extract the endpoints it documents (lines starting
     with an HTTP verb: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
   - Flag any documented endpoint whose path+method has no match in `paths` (allowing for
     path-param naming differences, e.g. `{employee_id}` vs `{id}`).
   - Flag any `paths` entry in the OpenAPI file that isn't mentioned in any `specs/api/*.md`
     file at all (a completely undocumented endpoint).
   - This is a best-effort structural diff, not full schema validation — don't try to
     compare every field type. The goal is to catch "this endpoint was removed/renamed/added
     on the backend and the docs don't know yet," not to lint the whole schema.
   - If `back-end-openapi.json` is missing, skip the sync check and note it as skipped
     (don't fail).

3. **Relevance scan**. Match the feature description against the domain files by keyword:

   | Domain file | Keywords |
   |---|---|
   | `auth.md` | login, token, session, authentication |
   | `employees.md` | employee, HR, human resources, salary, advance, payroll |
   | `journey.md` | journey, check-in, selfie, location, geolocation, employee tracking |
   | `loans.md` | loan, installment, buggyman, partner loan, payment plan |
   | `partners.md` | partner, buggyman, business partner |
   | `products.md` | product, stock, inventory |
   | `reports.md` | report, sales report, partner-customer |
   | `roles.md` | role, permission |
   | `sales.md` | sale, checkout, order, payment |
   | `shared.md` | always include — cross-cutting auth/permissions/pagination/enums/error format |
   | `users.md` | user, account, roles assignment |

   Read every file that matches, plus `shared.md` unconditionally. If nothing matches
   (feature is purely frontend/UI, no backend interaction), say so explicitly and skip
   straight to the report.

4. **Extract what matters for a spec** from the matched files — endpoints available,
   request/response shapes, and especially the quirks already flagged in the docs
   (search for phrases like "code inconsistency", "known code gap", "different shape",
   "write-only", "silently", "not persisted", "server-computed"). These are the details
   most likely to cause a spec to assume backend behavior that doesn't actually exist.

## Report

Output a short block, not a full re-statement of the contract files:

```markdown
## API Contract Check

**Sync status**: [in sync | drift found: <list> | skipped: <reason>]

**Relevant contract files**: [list, or "none — no backend interaction detected"]

**Notes for this spec**:
- [endpoint/shape/quirk relevant to the feature, one line each]
```

- If drift was found, recommend the user (or a follow-up task) update the affected
  `specs/api/*.md` file(s) — do not edit them yourself unless explicitly asked, since
  they represent verified-by-hand documentation of live backend behavior.
- This is informational: never block `/speckit-specify` from proceeding. The spec itself
  stays implementation-agnostic (no API details belong in `spec.md`), but the notes here
  should inform what the spec author treats as feasible, and will matter again at
  `/speckit-plan` time when the API details do belong in the plan.

## Done When

- [ ] Sync check performed (or explicitly skipped with a reason)
- [ ] Relevant contract files identified from the feature description
- [ ] Report block output to the caller
