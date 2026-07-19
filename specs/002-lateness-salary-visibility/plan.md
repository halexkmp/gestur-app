# Implementation Plan: Lateness Configuration & Employee Salary Visibility

**Branch**: `002-lateness-salary-visibility` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-lateness-salary-visibility/spec.md`

## Summary

Two additions to the existing HR/employee domain: (1) an HR-only screen to view and edit
the system-wide lateness configuration (expected entrance time, tolerance, deduction
interval, deduction amount) backed by `GET/PUT /employees/lateness-config`; and (2) a
mobile-responsive salary/advances/lateness visibility section added directly below the
"register journey" button on the employee's own check-in screen, backed by
`GET /employees/salary-summary/{employee_id}` (per the API contract). Per
`/speckit-clarify`, User Story 2 has a hard backend prerequisite: today every
`/employees/*` endpoint requires the `HUMAN_RESOURCES` role, so a plain `EMPLOYEE` cannot
fetch their own data; this plan builds the frontend against a documented self-service
contract addition and treats the backend change as an explicit external dependency rather
than working around it (e.g., by widening role checks).

Technical approach: extend two existing screens rather than add new top-level nav pages
(per Constitution Principle V) — a new tab inside `HR.tsx` for the config, and a new child
component inside `EmployeeJourney.tsx` for the visibility section — using the existing
domain-slice pattern (`types/` → `services/` → `hooks/` → `components/`).

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), React 18.3

**Primary Dependencies**: Vite 5, Tailwind CSS 3, `lucide-react` icons, existing
`src/lib/api.ts` fetch wrapper — no new dependencies introduced

**Storage**: N/A — all persistent data lives in the external backend consumed via
`VITE_API_URL`; the only client-side persistence involved is the existing
`localStorage.auth_token`

**Testing**: Vitest + `@testing-library/react`, following the existing `useLoans.test.ts` /
`useJourney.test.ts` pattern for the new `useLatenessConfig` hook; the known repo gap
(`src/test/setup.ts` missing, see CLAUDE.md) must be fixed if these new hook tests are
added, since it currently breaks `npm run test` for every suite

**Target Platform**: Web SPA (desktop + mobile browsers). Mobile responsiveness down to
360px width is a hard requirement for the employee salary visibility section (SC-003);
the HR lateness-config tab remains desktop-oriented per the spec's assumptions

**Project Type**: Single frontend project (web-app). The backend is a separate, externally
owned service — no backend code changes happen in this repo; the self-service access gap
(see Summary) is tracked as an external dependency, documented in `contracts/`

**Performance Goals**: Standard SPA interactivity; no special targets beyond the existing
app baseline

**Constraints**: Strict layering (`components/` → `hooks/` → `services/` → `lib/`/`types/`),
no `any`, ~150-line practical component ceiling, must reuse existing role-gating
(`useAuth()` booleans) and existing tab/section UI patterns rather than introduce new UI
primitives or a new top-level nav page

**Scale/Scope**: One new HR-only tab (lateness configuration) inside the existing HR
screen; one new self-service section inside the existing employee journey screen; one new
domain slice (`latenessConfig`); a type-accuracy fix to the existing `SalarySummaryResponse`
type (missing lateness fields); no new routes/pages in `App.tsx`'s top-level switch

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Layered Architecture | New code follows `components/` (UI) → `hooks/` (orchestration) → `services/` (API calls) → `types/` (models); no component fetches directly | PASS |
| II. Service-Only Backend Access | All new backend calls go through new `latenessConfigService.ts` and existing `employeeService.ts`, both calling `src/lib/api.ts`; no direct `fetch` | PASS |
| III. Strict TypeScript | New `LatenessConfig` type added to `types/latenessConfig.ts`, re-exported via `types/index.ts`; existing `SalarySummaryResponse` corrected to match the contract; no `any` | PASS |
| IV. Component Focus & Size Discipline | Lateness config UI extracted into its own component (not inlined into the already-493-line `HR.tsx`); salary visibility extracted into its own component (not inlined into `EmployeeJourney.tsx`) | PASS |
| V. Consistency Over Novelty | No new top-level nav page added — config becomes a third tab in the existing HR screen, visibility becomes a new section in the existing journey screen, both explicitly requested by the user as the two "screens" in scope | PASS |

No violations — Complexity Tracking table not needed.

**Risk carried forward (not a constitution violation, but material to delivery)**: User
Story 2 cannot function end-to-end until the backend adds self-scoped access for the
`EMPLOYEE` role (see `contracts/employee-self-service-salary.md`). This plan builds the
frontend against that documented contract; User Story 1 has no such dependency and can ship
independently.

## Project Structure

### Documentation (this feature)

```text
specs/002-lateness-salary-visibility/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── lateness-config.md
│   └── employee-self-service-salary.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — not created here)
```

### Source Code (repository root)

Single existing frontend project — no new top-level directories. New/changed files only:

```text
src/
├── types/
│   ├── latenessConfig.ts        # NEW — LatenessConfig model
│   ├── employee.ts              # CHANGED — add late_delay_minutes, late_days_count,
│   │                            #           late_deduction_total to SalarySummaryResponse
│   └── index.ts                 # CHANGED — re-export latenessConfig
├── services/
│   ├── latenessConfigService.ts # NEW — GET/PUT /employees/lateness-config
│   └── employeeService.ts       # CHANGED — add self-service salary-summary/advances calls
├── hooks/
│   ├── useLatenessConfig.ts     # NEW — load/save config, validation
│   └── useEmployeeSalarySummary.ts # NEW — self-service summary + advances for current user
├── components/
│   ├── HR.tsx                   # CHANGED — add third tab wiring only
│   ├── LatenessConfigPanel.tsx  # NEW — the tab's form UI (HR-only)
│   └── Journey/
│       ├── EmployeeJourney.tsx        # CHANGED — render new section below register button
│       └── EmployeeSalarySummary.tsx  # NEW — the visibility section UI (mobile-responsive)
```

**Structure Decision**: Extends the existing single-project frontend layout; no new
top-level page/route is added to `App.tsx` or `Layout.tsx`'s nav — the two "screens" from
the feature request are realized as (1) a new tab inside the existing HR screen and (2) a
new section inside the existing employee journey screen, per Constitution Principle V and
the domain-slice pattern already used by `loan`/`journey`/`employee`.

## Complexity Tracking

*No violations — table not needed.*
