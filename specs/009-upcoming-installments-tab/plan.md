# Implementation Plan: Upcoming Installments Tab

**Branch**: `009-upcoming-installments-tab` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-upcoming-installments-tab/spec.md`

## Summary

Add a third tab to the Bugueiros page listing every installment still owed, row by row, across all partners — ordered by due date, scoped by a date range and an "include overdue" switch.

The backend already serves this: `GET /loans/upcoming-installments` returns a flat array with every field the table needs, including the denormalized `partner_name` and a server-computed `is_overdue`. No backend work, no new external dependency.

The technical approach is deliberately unoriginal: this feature is the row-level sibling of feature 008 (the Resumo tab), and mirrors its structure one layer at a time — `loanService.getUpcomingInstallments` alongside `getPeriodSummary`, `useUpcomingInstallments` alongside `useLoanPeriodSummary` (same request-id guard against stale responses, same loading/refreshing split, same preset range control), and a `UpcomingTab` that composes small presentational children exactly as `SummaryTab` does. Two things are genuinely new and carry the real risk: summing money that arrives as decimal strings, and making overdue state legible without the user comparing dates.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), React 18.3

**Primary Dependencies**: React 18, Vite 5, Tailwind CSS 3, `lucide-react` (icons). No new dependency is introduced.

**Storage**: N/A — read-only view over the backend at `VITE_API_URL`. No client persistence; filter state lives in component state and survives tab switches only because the tab stays mounted.

**Testing**: Vitest + Testing Library (`jsdom`). Baseline verified at plan time: `1 failed | 7 passed (8 files)`, `1 failed | 57 passed (58 tests)`. The single failure is `src/hooks/useEmployeePaychecks.test.ts`, which asserts a hardcoded `month: 7` against the current month — pre-existing and unrelated. Treat any second failure as caused by this work.

**Target Platform**: Modern browsers, desktop and mobile. Interface language pt-BR, currency BRL.

**Project Type**: Single-page web frontend; the backend is a separate service consumed over REST.

**Performance Goals**: Filter change to updated list within 2s under normal conditions (SC-007), dominated by the network round trip. Rendering stays responsive at several hundred rows (SC-008) without virtualization — consistent with the existing partner breakdown table, which also renders unvirtualized.

**Constraints**:
- Money arrives as decimal *strings* with two decimals (`"0.00"`, never `"0"`). Never `toLocaleString` a string directly (see the note on `formatCurrency` in `src/lib/formatters.ts`), and never sum with naive float addition — see [research.md](./research.md) R-002.
- Dates are local-calendar `YYYY-MM-DD`. Use `toISODateLocal`/`formatDateBR`; `toISOString()` reports the UTC day and shifts the date after 21:00 in UTC-3.
- `is_overdue` is server-computed against the server's clock and must be trusted as-is, not recomputed from the selected range (FR-011).
- With the overdue switch on, the response has **no lower date bound** — the whole unsettled history returns. The row count in the summary bar exists to make that legible (FR-012).
- No pagination exists anywhere in this API.

**Scale/Scope**: One new tab. 1 hook, 1 service method, 3 new types, 6 new components, 3 modified files. Every component stays well under the 150-line ceiling.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Assessment |
|---|---|---|
| **I. Layered Architecture** (non-negotiable) | Components render only; hooks orchestrate; services call the API | ✅ PASS. `UpcomingTab` and children render and raise events. All state, fetching, filter logic, and the outstanding-total computation live in `useUpcomingInstallments`. `loanService` is the only thing touching `api`. |
| **II. Service-Only Backend Access** | All backend access via `src/lib/api.ts`, only from `services/` | ✅ PASS. One new method, `loanService.getUpcomingInstallments`, calling `api.get`. No `fetch` in any component or hook. |
| **III. Strict TypeScript** | No `any`; explicit types; models in `types/<domain>.ts` re-exported through `types/index.ts` | ✅ PASS. New models go in the existing `src/types/loan.ts`, already re-exported via `export * from './loan'`. `status` is typed as `Exclude<InstallmentStatus, 'PAID'>`, encoding the contract's "never PAID" guarantee in the type system rather than in a comment. |
| **IV. Component Focus & Size** | Single responsibility, ~150-line ceiling, logic in hooks | ✅ PASS. Largest new component is `UpcomingInstallmentsTable` at an estimated ~110 lines. `UpcomingTab` is an orchestrator at ~80, matching `SummaryTab`'s 90. Estimates are in the Source Code section below. |
| **V. Consistency Over Novelty** | Extend existing screens; reuse components/hooks/patterns; minimal scoped changes; no new UI libraries | ✅ PASS. Adds a tab to an existing page rather than a page. Reuses `PeriodRangeFilter`, `LoanDrawer`, `usePartnerLoanDrawer`, `formatCurrency`, `formatDateBR`, `periodPresetRange`, and the `useLoanPeriodSummary` hook shape. No new dependency. Two existing files are touched, both minimally and both required — see below. |

**Changes to existing files, justified** (Principle V forbids incidental refactoring):

1. `src/components/Buggyman.tsx` — must change; the tab cannot exist otherwise. The per-tab `summaryVisited` boolean does not extend cleanly to three tabs, so it becomes a single visited-set. Contained, ~10 lines, no behavior change to existing tabs.
2. `src/hooks/usePartnerLoanDrawer.ts` — `openFor` currently takes `LoanPeriodSummaryPartner` but reads only `.partner_id`. Widening the parameter to `{ partner_id: string }` lets installment rows reuse it. `LoanPeriodSummaryPartner` is structurally assignable, so **`SummaryTab` needs no change and its behavior is untouched**. One line.
3. `src/lib/formatters.ts` — additive only: one new `daysOverdue` helper. Nothing existing is modified.

**Result: PASS, no violations.** Complexity Tracking is therefore omitted.

### Post-Design Re-Check (after Phase 1)

Re-evaluated against the artifacts actually produced ([data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)):

| Principle | Post-design result |
|---|---|
| I. Layered Architecture | ✅ Holds. The design moved `totalOutstanding`, `overdueCount`, `rowCount` and `isEmpty` into the hook as derived values (data-model.md), keeping arithmetic out of components. Every component contract in `contracts/ui.md` is props-in / callbacks-out. |
| II. Service-Only Backend Access | ✅ Holds. Exactly one new call site, `loanService.getUpcomingInstallments`. Drill-through reuses `usePartnerLoanDrawer` and `LoanDrawer`, adding no new endpoint call sites. |
| III. Strict TypeScript | ✅ Holds. Three types in `types/loan.ts`, no `any`, all signatures explicit. `UpcomingInstallmentStatus = Exclude<InstallmentStatus, 'PAID'>` derives from the existing union so the two cannot drift. |
| IV. Component Focus & Size | ✅ Holds. Six components, each one responsibility, largest ~110 lines. The table/cards split was driven by the responsive requirement, not by size, and matches the existing 008 pair. |
| V. Consistency Over Novelty | ✅ Holds. No new dependency (virtualization, decimal, and date libraries were each considered and rejected — R-002, R-003, R-008). Three existing files touched, each minimally and each necessarily. One deliberate duplication is recorded with its reasoning: `UpcomingTabStates` is not merged with `SummaryTabStates`, because sharing would require shape and copy props and edits to working 008 code, for ~20 lines of markup (contracts/ui.md). |

**Post-design result: PASS.** No new violations introduced by the design; Complexity Tracking remains omitted.

## Project Structure

### Documentation (this feature)

```text
specs/009-upcoming-installments-tab/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
├── contracts/
│   ├── api.md           # Backend endpoint contract as consumed here
│   └── ui.md            # Component/hook interface contracts
└── tasks.md             # NOT created by /speckit-plan
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Buggyman.tsx                        # MODIFIED — third tab + visited-set
│   ├── LoanDrawer.tsx                      # reused unchanged (drill-through)
│   └── Buggyman/
│       ├── PeriodRangeFilter.tsx           # reused unchanged (date range)
│       ├── UpcomingTab.tsx                 # NEW ~80  — orchestrator
│       ├── UpcomingFiltersBar.tsx          # NEW ~55  — overdue switch + refresh
│       ├── UpcomingSummaryBar.tsx          # NEW ~45  — row count, totals
│       ├── UpcomingInstallmentsTable.tsx   # NEW ~110 — desktop table (sm+)
│       ├── UpcomingInstallmentsCards.tsx   # NEW ~60  — mobile cards (<sm)
│       └── UpcomingTabStates.tsx           # NEW ~75  — loading/empty/error
├── hooks/
│   ├── useUpcomingInstallments.ts          # NEW ~110 — state, fetch, totals
│   ├── useUpcomingInstallments.test.ts     # NEW      — hook unit tests
│   └── usePartnerLoanDrawer.ts             # MODIFIED — widen openFor param
├── services/
│   └── loanService.ts                      # MODIFIED — +getUpcomingInstallments
├── types/
│   └── loan.ts                             # MODIFIED — +3 types (re-exported)
└── lib/
    ├── formatters.ts                       # MODIFIED — +daysOverdue
    └── formatters.test.ts                  # MODIFIED — +daysOverdue cases
```

**Structure Decision**: The existing single-project layered structure under `src/` is used unchanged. This feature is a domain slice extension, not a new area: it adds to the established `loan` slice (`types/loan.ts` → `services/loanService.ts` → `hooks/use*.ts` → `components/Buggyman/*`), following `loanService.ts`/`useLoans.ts` as the reference implementation named in CLAUDE.md. New tab-specific components are colocated in the existing `src/components/Buggyman/` folder alongside the 008 components, keeping the page's parts together.
