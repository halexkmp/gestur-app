# Implementation Plan: Link Employee to User Account

**Branch**: `001-link-employee-user` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-link-employee-user/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

HR staff need to associate an Employee record with a login (User) account directly from the
existing "New/Edit Employee" modal in `HR.tsx` — either by linking an already-existing
eligible account (EMPLOYEE/OPERATOR role, not already linked elsewhere) or by creating a new
account inline (name/username/password, auto-assigned the EMPLOYEE role). This is a frontend-only
change: the backend already supports `user_id` on `POST/PUT /employees/*` per
`specs/api/employees.md`, and user creation/listing already exists via `/users/*`. The employee
form modal will be extracted out of `HR.tsx` into its own component (current inline modal plus
new fields would push `HR.tsx` further past the project's ~150-line component guideline) and will
orchestrate: an existing-user searchable picker, an inline new-user sub-form, and submission
sequencing (create user first when needed, then create/update the employee with the resulting
`user_id`).

## Technical Context

**Language/Version**: TypeScript 5.5 (React 18.3, Vite 5.4)

**Primary Dependencies**: React 18, Tailwind CSS 3.4, lucide-react (icons) — no new dependencies

**Storage**: N/A — frontend consumes the existing backend REST API via `VITE_API_URL`; no local persistence beyond the existing `localStorage.auth_token`

**Testing**: Vitest + Testing Library (existing setup). Note the pre-existing repo gap: `vite.config.ts` points `test.setupFiles` at a missing `src/test/setup.ts`, so `npm run test` currently fails for every suite. This feature does not require adding automated tests (none exist today for `HR.tsx` or `Users.tsx`), so this plan does not fix that gap; `quickstart.md` covers manual verification instead.

**Target Platform**: Web browser (SPA), existing responsive breakpoints (mobile/desktop) already used throughout `HR.tsx`/`Users.tsx`

**Project Type**: Single-project web frontend (this repo has no backend code; the backend is an external service)

**Performance Goals**: No feature-specific targets beyond existing SPA responsiveness — candidate user lists are small (no pagination anywhere in this backend), client-side filtering is sufficient

**Constraints**:
- Must go through `employeeService`/`userService` only (Principle II) — no direct `fetch`.
- No new UI libraries — the existing-user picker is a plain search input + filtered list, matching patterns already used for other selects in `HR.tsx`, not a new combobox dependency.
- `GET /users/` only returns the full list to `ADMIN` callers (per `specs/api/shared.md`); any other caller (including `HUMAN_RESOURCES`, which is what actually gates this page) only sees themselves. The picker must degrade to "no eligible existing users found — create a new account" rather than error when this happens (already covered by the spec's empty-candidates edge case).

**Scale/Scope**: One existing page (`HR.tsx`) extended; one new child component extracted for the employee form modal; no new top-level page, no new route/nav entry.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Layered Architecture** — PASS. UI stays in `components/`, all backend calls stay in
  `services/employeeService.ts` and `services/userService.ts`, new shapes go in `types/`. Note:
  `HR.tsx` currently calls services directly from the component with no intervening hook
  (unlike `useLoans.ts`/`useJourney.ts`). This feature follows that existing convention rather
  than introducing a new `useEmployees` hook, per Principle V (follow the closest existing
  implementation; don't refactor unrelated code as a side effect). Not treated as a violation —
  it's consistency with the domain's current state, not new complexity.
- **II. Service-Only Backend Access** — PASS. New calls (`userService.create` for inline account
  creation, existing `employeeService.create`/`update` with the new `user_id` field) all go
  through the existing service wrappers.
- **III. Strict TypeScript** — PASS, with one improvement in scope: `userService.create`/`update`
  currently type their payload as `any`. Since this feature adds a new call site that constructs
  that payload, this plan adds proper `CreateUserRequest`/`UpdateUserRequest` types (see
  `data-model.md`) and tightens `userService`'s signature as part of this change — not a broader
  unrelated refactor, since the feature directly needs a correctly-typed payload here.
- **IV. Component Focus & Size Discipline** — Currently at risk: `HR.tsx` is already ~590 lines,
  past the ~150-line practical ceiling, and the new account-link UI would grow it further.
  Resolution: extract the employee create/edit modal (already a self-contained `<form>` block)
  into a new `components/EmployeeFormModal.tsx`, which owns the new account-link section
  internally. `HR.tsx` shrinks to owning list/tabs state and rendering the modal.
- **V. Consistency Over Novelty** — PASS. Reuses existing modal chrome, table/badge styling from
  `HR.tsx`/`Users.tsx`, and the existing role-badge color convention from `Users.tsx` for
  indicating linked-account status.

No unjustified violations — Complexity Tracking table not needed.

**Post-Phase-1 re-check**: `data-model.md` and `contracts/employee-user-endpoints.md` confirm
no new backend endpoints, no new services, and no new state-management layer beyond what was
already decided above. The `EmployeeFormModal.tsx` extraction (Principle IV) and the
`CreateUserRequest`/`UpdateUserRequest` typing (Principle III) are the only structural changes,
both already accounted for. Gate still PASSES.

## Project Structure

### Documentation (this feature)

```text
specs/001-link-employee-user/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── employee-user-endpoints.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── HR.tsx                    # MODIFIED — employee list gains a "linked account" indicator
│   │                              #   column; inline employee <form> modal extracted out
│   └── EmployeeFormModal.tsx     # NEW — create/edit employee form, incl. account-link section
│                                  #   (link-existing search picker / create-new sub-form / none)
├── services/
│   ├── employeeService.ts        # UNCHANGED — create/update already pass through whatever
│                                  #   payload shape CreateEmployeeRequest/UpdateEmployeeRequest
│                                  #   declare, so adding user_id to the types is sufficient
│   └── userService.ts            # MODIFIED — create/update signatures typed (no more `any`)
└── types/
    ├── employee.ts                # MODIFIED — Employee/CreateEmployeeRequest/
    │                               #   UpdateEmployeeRequest gain `user_id?: string | null`
    └── auth.ts                    # MODIFIED — add CreateUserRequest/UpdateUserRequest
                                    #   alongside existing User/Role (kept in this file to match
                                    #   where User/Role already live, rather than relocating them
                                    #   into a new types/user.ts as an unrelated move)
```

**Structure Decision**: Single existing frontend project (`src/`). No backend code in this repo.
The change is additive within the existing `HR.tsx` domain slice, plus one new presentational
component to keep `HR.tsx` within the codebase's size discipline. No new services, no new
top-level page, no new route.

## Complexity Tracking

> No Constitution Check violations require justification — table intentionally omitted.
