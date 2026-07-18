---
name: "api-contract-check"
description: "Scan the backend API contract docs in specs/api/ and surface endpoints, shapes, and quirks relevant to a new feature. Runs automatically as a before_specify hook, or invoke directly."
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
via `VITE_API_URL`, and is the **sole source of truth** for backend behavior — including
real behavioral quirks (fields that are write-only, endpoints with inconsistent shapes,
silent permission downgrades, etc.). There is no OpenAPI schema in this repo to cross-check
against; a previous `back-end-openapi.json` was removed for being outdated and must not be
reintroduced or relied upon. This skill's job is a **relevance scan** — surface the parts
of the contract that matter for the feature being specified, so the spec doesn't contradict
or duplicate backend behavior.

## Steps

1. **Locate the contract**. The files live in `specs/api/`:
   `auth.md`, `employees.md`, `journey.md`, `loans.md`, `partners.md`, `products.md`,
   `reports.md`, `roles.md`, `sales.md`, `shared.md`, `users.md`.

   If `specs/api/` doesn't exist or is empty, report that no API contract is available
   and stop — don't block the caller, just note the gap.

2. **Relevance scan**. Match the feature description against the domain files by keyword:

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

3. **Extract what matters for a spec** from the matched files — endpoints available,
   request/response shapes, and especially the quirks already flagged in the docs
   (search for phrases like "code inconsistency", "known code gap", "different shape",
   "write-only", "silently", "not persisted", "server-computed"). These are the details
   most likely to cause a spec to assume backend behavior that doesn't actually exist.

## Report

Output a short block, not a full re-statement of the contract files:

```markdown
## API Contract Check

**Relevant contract files**: [list, or "none — no backend interaction detected"]

**Notes for this spec**:
- [endpoint/shape/quirk relevant to the feature, one line each]
```

- This is informational: never block `/speckit-specify` from proceeding. The spec itself
  stays implementation-agnostic (no API details belong in `spec.md`), but the notes here
  should inform what the spec author treats as feasible, and will matter again at
  `/speckit-plan` time when the API details do belong in the plan.
- If the contract itself looks wrong or internally inconsistent, recommend the user (or a
  follow-up task) update the affected `specs/api/*.md` file(s) — do not edit them yourself
  unless explicitly asked, since they represent verified-by-hand documentation of live
  backend behavior.

## Done When

- [ ] Relevant contract files identified from the feature description
- [ ] Report block output to the caller
