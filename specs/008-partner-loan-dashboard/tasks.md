---

description: "Task list for Partner Loan Period Dashboard"
---

# Tasks: Partner Loan Period Dashboard

**Input**: Design documents from `/specs/008-partner-loan-dashboard/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/loan-period-summary.md](./contracts/loan-period-summary.md), [quickstart.md](./quickstart.md)

**Tests**: Not requested in the spec, and the constitution does not require them for every change. Two test tasks are included and marked **OPTIONAL** — T007 in particular is recommended, because the string-money formatting trap (research.md R1) is the single most likely defect in this feature and is trivially unit-testable.

**Organization**: Tasks are grouped by user story. Phase 2 delivers the data layer and the tab shell, so US1, US2, and US3 each stay independently implementable and testable inside that shell.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task

## Path Conventions

Single-project React frontend. All source under `src/` at the repository root, per the structure decision in plan.md.

---

## Phase 1: Setup (Blocking Prerequisite)

**Purpose**: Confirm the backend this feature entirely depends on actually exists. Nothing else may start until T001 passes.

- [ ] T001 Verify `GET /loans/period-summary` against the running backend by working through all 7 steps of the "Verification checklist" in `specs/008-partner-loan-dashboard/contracts/loan-period-summary.md` (200 with real data; money fields are two-decimal **strings**; both reconciliation identities hold; empty range returns 200 not 404; inverted range returns 400; an inactive partner appears; a multi-loan partner appears once)
- [ ] T002 Record the T001 results in the "Verification checklist" section of `specs/008-partner-loan-dashboard/contracts/loan-period-summary.md`, changing its Status line from "DOCUMENTED, NOT YET VERIFIED" to verified; if live behavior disagrees with the docs, correct `specs/api/loans.md` by hand (it is the source of truth) and update the contract file to match

**⚠️ STOP**: If T001 fails because the endpoint is absent, the feature is blocked at the service layer. Do not proceed — nothing in the plan changes, only the timing.

**Checkpoint**: Endpoint confirmed; the contract is trustworthy.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The data layer (types → service → hook) and the tab shell. Every user story renders inside the shell and reads from the hook.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Types and utilities

- [X] T003 [P] Add `LoanPeriodSummary`, `LoanPeriodSummaryPartner`, and `LoanPeriodSummaryParams` interfaces plus the `PeriodPresetId` union to `src/types/loan.ts` exactly as specified in `specs/008-partner-loan-dashboard/data-model.md` — every monetary field typed `string`, never `number`. `PeriodPresetId` belongs here rather than in `lib/`, per Constitution III (models live in `types/<domain>.ts`). No change to `src/types/index.ts` is needed; it already re-exports `./loan`
- [X] T004 [P] Add `formatCurrency(value: string | number): string` to `src/lib/formatters.ts` that coerces via `Number(value)` **before** calling `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`. Include a doc comment explaining that `String.prototype.toLocaleString` ignores its options argument, so coercion is mandatory (research.md R1)
- [X] T005 Add `toISODateLocal(date: Date): string` to `src/lib/formatters.ts`, building `YYYY-MM-DD` from `getFullYear()`/`getMonth()`/`getDate()` — never `toISOString()`, which yields the UTC day and shifts the boundary in UTC-3 (research.md R4). Depends on T004 (same file)
- [X] T006 Add a `periodPresetRange(preset: PeriodPresetId): { startDate: string; endDate: string }` helper to `src/lib/formatters.ts`, importing `PeriodPresetId` from `../types`, covering `current-month`, `previous-month`, `current-quarter`, `current-year`, `next-30-days` with the exact boundaries in research.md R5 (month-end via `new Date(year, month + 1, 0).getDate()`; "next 30 days" is today + 29, inclusive). Depends on T003, T005 (same file)

### Service and hook

- [X] T007 [P] **[OPTIONAL]** Add `src/lib/formatters.test.ts` covering `formatCurrency` with a **string** input (`"1234.50"` → `R$ 1.234,50`), a zero string (`"0.00"`), and a number input; plus `toISODateLocal` returning the local calendar day for a late-evening date in UTC-3. Depends on T006
- [X] T008 Add `getPeriodSummary(params: LoanPeriodSummaryParams): Promise<LoanPeriodSummary>` to `src/services/loanService.ts`, calling `api.get<LoanPeriodSummary>('/loans/period-summary', { params })`. No new service file — extend the existing `loanService` object per the domain-slice pattern. Depends on T003
- [X] T009 Create `src/hooks/useLoanPeriodSummary.ts` implementing the hook contract in plan.md: owns `startDate`/`endDate` (defaulting to `periodPresetRange('current-month')`), exposes `summary`, `setRange`, `invalidRange`, `loading`, `refreshing`, `error`, `refetch`. Validate the range by lexicographic `endDate >= startDate` comparison (correct for zero-padded ISO dates) and **skip the fetch entirely while invalid**. Distinguish `loading` (no data on screen yet) from `refreshing` (range changed with data present). Follow the `useLoans.ts` error convention: `err instanceof Error ? err.message : <fallback>`. Depends on T006, T008
- [X] T010 Add a monotonic request-id `useRef` guard to `src/hooks/useLoanPeriodSummary.ts` so a resolving response updates state only when its captured id is still current, preventing a slow earlier range from overwriting a newer one (research.md R7). Depends on T009
- [X] T011 **[OPTIONAL]** Add `src/hooks/useLoanPeriodSummary.test.ts` mirroring the structure of `src/hooks/useLoans.test.ts`: mock `loanService.getPeriodSummary`, assert the current-month default fetch on mount, assert no call fires while the range is inverted, assert `error` is populated on rejection, and assert the stale-response guard discards an out-of-order resolution. Depends on T010

### Tab shell

- [X] T012 Create `src/components/Buggyman/PartnersTab.tsx` by moving the existing partner list out of `src/components/Buggyman.tsx` **verbatim** — same JSX, same handlers (`loadBuggymans`, `deleteBuggyman`, `handleSubmit`, `startEdit`, `resetForm`), same `search`/`onlyWithLoans`/form state, same `LoanDrawer` usage and `isSuperAdmin` gate on the coin icon. No behavior, prop, or styling change (spec SC-010)
- [X] T013 Rewrite `src/components/Buggyman.tsx` as a thin tab shell (~60 lines): keep the page header and "Novo Bugueiro" button placement, hold `activeTab: 'partners' | 'summary'` state defaulting to `'partners'` plus a `summaryVisited` boolean, and render the tab bar using the exact markup pattern from `src/components/HR.tsx` (border-b-2, blue-600 active, lucide icon + label). Render the summary tab button **only** when `isSuperAdmin` from `useAuth()` — not disabled, not an access-denied panel (spec FR-003). Once the summary tab has been visited, keep **both** panels mounted and hide the inactive one with the `hidden` class — unmounting `SummaryTab` would destroy the `useLoanPeriodSummary` state and reset the date range, breaking FR-004. Mount `SummaryTab` only after its first visit, so no period-summary request fires for a user who never opens it. Depends on T012
- [X] T014 Create `src/components/Buggyman/SummaryTab.tsx` as a composition root that calls `useLoanPeriodSummary()` and renders nothing but a placeholder for now. It must contain no business logic (Constitution I) and stay under the ~150-line ceiling (Constitution IV). Depends on T009, T013

**Checkpoint**: Data flows end to end; the tab shell renders; the existing partner list is unchanged. User stories can now proceed in parallel.

---

## Phase 3: User Story 1 - Read the period totals (Priority: P1) 🎯 MVP

**Goal**: A date range filter plus the headline figures — expected revenue, returned capital, profit, received, outstanding, and counts — with correct loading, empty, and error states.

**Independent Test**: Open the summary tab with loans present, confirm the current-month figures match the endpoint response, change the range and confirm every figure updates together, then test an empty range and a backend failure. Fully testable without the breakdown table or drill-through existing.

- [X] T015 [P] [US1] Create `src/components/Buggyman/PeriodRangeFilter.tsx` with the five preset buttons from research.md R5 (labels: "Mês atual", "Mês anterior", "Trimestre atual", "Ano atual", "Próximos 30 dias") plus two `<input type="date">` fields for custom entry, styled after the filter block in `src/components/Reports.tsx`. Props: `startDate`, `endDate`, `activePreset`, `invalidRange`, `onPresetSelect`, `onDateChange`. Render an inline validation message when `invalidRange` is true, and highlight the active preset (falling back to a "Personalizado" indication once dates are edited off a preset boundary)
- [X] T016 [P] [US1] Create `src/components/Buggyman/PeriodTotalsCards.tsx` rendering the headline figures from a `summary: LoanPeriodSummary` prop, all through `formatCurrency`. Give expected revenue, received, and outstanding visual prominence over capital, profit, `installments_count`, and `partners_count` (spec FR-017). Use the exact labels pinned in the "UI copy" table in plan.md — in particular "Previsto a receber" with the *"vencimentos no período"* sublabel, never "recebido no período" (spec FR-014, contract selection semantics). Use lucide-react icons already available in the project
- [X] T017 [P] [US1] Create `src/components/Buggyman/PeriodSplitBars.tsx` rendering two stacked proportion bars from a `summary` prop — capital|profit and received|outstanding — as Tailwind `div`s with percentage widths, a legend, and the collection percentage. No charting library (Constitution V, research.md R9). When `expected_revenue` is `"0.00"`, render `—` for the percentage and a flat neutral track — never `0%` or `NaN%` (spec FR-016, data-model.md guards)
- [X] T018 [US1] Wire `PeriodRangeFilter`, `PeriodTotalsCards`, and `PeriodSplitBars` into `src/components/Buggyman/SummaryTab.tsx`, and state the applied range in plain language on screen so every figure is attributed to a period (spec FR-009). Depends on T015, T016, T017
- [X] T019 [US1] Add the four render states to `src/components/Buggyman/SummaryTab.tsx`: a skeleton on first `loading` sized so the layout does not jump when data arrives (FR-026); a dimmed-with-spinner treatment while `refreshing` that preserves layout and scroll (FR-029); a distinct empty state when `installments_count === 0`, **owned by the tab, not the table**, explaining nothing is due and inviting a wider range (FR-027); and an error state with a retry button calling `refetch()` (FR-028). Use the pinned copy from the "UI copy" table in plan.md — all pt-BR (FR-030). Depends on T018
- [ ] T020 [US1] Verify the US1 surface at 360px width — cards stack, the filter wraps, no horizontal page scroll (spec FR-024, SC-007). Depends on T019

**Checkpoint**: The dashboard is useful on its own. This is the MVP — it replaces the manual per-partner tallying described in the spec overview.

---

## Phase 4: User Story 2 - See who owes what (Priority: P2)

**Goal**: The per-partner breakdown — one row per partner, server-ordered by default, sortable, name-searchable, with per-row collection progress.

**Independent Test**: With several partners holding loans due in the range, confirm each appears exactly once with correct amounts, that rows sum to the headline totals, that the default order is largest-scheduled-first, and that the name search narrows rows without changing the totals.

- [X] T021 [P] [US2] Create `src/components/Buggyman/PartnerBreakdownTable.tsx` rendering `partners: LoanPeriodSummaryPartner[]` — columns for partner name, `installments_count`, `scheduled_amount`, `received_amount`, `outstanding_amount`, all money through `formatCurrency`. Follow the table structure in `src/components/HR/SalaryTab.tsx` (`bg-gray-50` header, `divide-y` body, `overflow-x-auto` wrapper). Preserve the server's incoming order as the default — do not re-sort on mount (spec FR-020, SC-005)
- [X] T022 [US2] Add sortable column headers to `src/components/Buggyman/PartnerBreakdownTable.tsx` for scheduled amount, outstanding amount, and partner name, using a `useMemo` over a `sortKey`/`sortDirection` state. Compare money by `Number()` and names with `localeCompare('pt-BR')`. Depends on T021
- [X] T023 [US2] Add a name search input to `src/components/Buggyman/PartnerBreakdownTable.tsx` that filters rows case-insensitively. It must narrow rows **only** — the headline totals passed to the other components stay untouched (spec FR-022). Depends on T021
- [X] T024 [US2] Add per-row collection progress to `src/components/Buggyman/PartnerBreakdownTable.tsx`: a small Tailwind progress bar from `received_amount / scheduled_amount`, and a distinct settled ("Quitado") visual when `outstanding_amount === "0.00"` — settled partners stay listed, never hidden (spec FR-023). Guard `scheduled_amount === "0.00"` with an empty track. Depends on T021
- [X] T025 [US2] Add the responsive treatment to `src/components/Buggyman/PartnerBreakdownTable.tsx`: table at `sm` and above, stacked cards below, so 360px never scrolls the page sideways (spec FR-024, SC-007). Depends on T021
- [X] T026 [US2] Mount `PartnerBreakdownTable` in `src/components/Buggyman/SummaryTab.tsx` below the totals, passing `summary.partners`. The table renders **no** empty state of its own for an empty period — that belongs to the tab (T019). Its only empty case is "nenhum bugueiro encontrado", shown when the name search excludes every row. Depends on T019, T025

**Checkpoint**: Totals and breakdown both work. An aggregate number is now an actionable collection list.

---

## Phase 5: User Story 3 - Drill into a partner from the dashboard (Priority: P3)

**Goal**: Activating a breakdown row opens the existing `LoanDrawer` for that partner; closing it returns to the dashboard with the range and data intact.

**Independent Test**: Click a partner row, confirm the existing loan detail opens with the correct name and Ativo/Inativo badge, close it, and confirm the dashboard is unchanged and did not refetch. Repeat for an inactive partner.

- [X] T027 [US3] Create `src/hooks/usePartnerLoanDrawer.ts` owning all drill-through state, so `SummaryTab` stays a composition root (Constitution I and IV). It loads the buggyman list once via the existing `partnerService.getByType(PartnerType.BUGGYMAN)` and exposes `drawerPartner: Partner | null`, `resolving: boolean`, `openFor(row: LoanPeriodSummaryPartner)`, and `close()`. The dashboard must render without waiting on the list — it is only needed at click time (research.md R10). Depends on T014
- [X] T028 [US3] Add row activation to `src/components/Buggyman/PartnerBreakdownTable.tsx` via an `onSelectPartner(partner: LoanPeriodSummaryPartner)` prop. Rows must be real `<button>` elements (or carry `role="button"` with key handling) so Tab + Enter works (spec FR-025). Depends on T026
- [X] T029 [US3] Implement resolution inside `src/hooks/usePartnerLoanDrawer.ts`: match `partner_id` against the loaded buggyman list, and when absent fall back to `partnerService.getById(partner_id)` (already present in `src/services/partnerService.ts`), flipping `resolving` while it is in flight. **Never construct a partial `Partner`** — `src/types/partner.ts` requires `loans`, `pix_key`, `type`, `active`, and `created_at`, and casting around that violates Constitution III. Going through `getById` also yields the true `active`, so the drawer's Ativo/Inativo badge is correct for inactive partners. Depends on T027, T028
- [X] T030 [US3] Wire `usePartnerLoanDrawer` into `src/components/Buggyman/SummaryTab.tsx` and mount the existing `LoanDrawer` with `isOpen`, `onClose={close}`, and `partner={drawerPartner}`. Closing must not trigger a refetch — the range and loaded summary stay exactly as they were (spec FR-025). Depends on T029

**Checkpoint**: All three user stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T031 [P] Remove the stale "Known issue" paragraph about a missing `src/test/setup.ts` from `CLAUDE.md` — the file exists and the suite runs (research.md baseline notes)
- [X] T032 [P] Remove any imports, state, or handlers left orphaned in `src/components/Buggyman.tsx` by the T012 extraction (the old `partnerService`, `PartnerType`, `LoanDrawer`, `Search`/`Trash2`/`Edit2`/`User`/`Coins` icon imports, and the form/search state all move to `PartnersTab.tsx`), so the shell imports only what it still renders
- [X] T033 Confirm no `console.log`, `alert()`, or `debugger` reached `src/components/Buggyman.tsx`, `src/components/Buggyman/*.tsx`, `src/hooks/useLoanPeriodSummary.ts`, or `src/lib/formatters.ts` — errors surface through the UI error state, matching `src/components/LoanDrawer.tsx` (Constitution: Workflow & Quality Gates)
- [X] T034 Run `npm run lint` and `npm run typecheck` — both must pass clean
- [X] T035 Run `npx vitest run` and confirm the result is the pre-existing baseline plus any new passing tests. Baseline on this branch is **41 passing / 1 failing**, the failure being `useEmployeePaychecks.test.ts`, which is unrelated to this feature. Anything beyond that one failure is a regression
- [ ] T036 Walk the full `specs/008-partner-loan-dashboard/quickstart.md` validation, steps 3 through 8, including the Step 4 regression pass over the moved partner list (search, filter, create, edit, delete, loans drawer) and a confirmation that every new label matches the pinned "UI copy" table in plan.md (spec FR-030)
- [X] T037 Check `src/components/Buggyman/SummaryTab.tsx` against Constitution IV's ~150-line ceiling. If it exceeds, extract the four render-state branches into a `src/components/Buggyman/SummaryTabStates.tsx` child — do not let it accumulate the way `src/components/Buggyman.tsx` did

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies. **Hard gate** — T001 must pass or the feature is blocked.
- **Phase 2 (Foundational)**: Depends on Phase 1. Blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2. No dependency on US2 or US3.
- **Phase 4 (US2)**: Depends on Phase 2. T026 additionally needs T019 (the SummaryTab states) as a mounting point.
- **Phase 5 (US3)**: Depends on Phase 2. T028 needs the table from US2 to have rows to activate.
- **Phase 6 (Polish)**: Depends on all desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent. Delivers the MVP on its own.
- **US2 (P2)**: Independent of US1's *content* — it renders from the same hook — but mounts into the SummaryTab, so it lands after T019 in practice.
- **US3 (P3)**: Depends on US2 existing, since drill-through is activated from a breakdown row. This is inherent to the story, not an artifact of the task split.

### Within Each User Story

- Presentational components first (they are pure and parallelizable), then wiring into `SummaryTab`, then states, then responsive verification.
- Every component reads money through `formatCurrency` from T004 — no local copies.

### Parallel Opportunities

- **Phase 2**: T003 and T004 are parallel (different files). T005 and T006 serialize behind T004 (same file), and T006 additionally needs `PeriodPresetId` from T003. T007 is parallel with T008 once T006 lands.
- **Phase 3**: T015, T016, and T017 are fully parallel — three separate new files with no shared state.
- **Phase 4**: T022, T023, T024, and T025 all touch `PartnerBreakdownTable.tsx`, so they are **sequential**, not parallel, despite being independent in concept.
- **Phase 6**: T031 and T032 are parallel. T037 must run after T030, when `SummaryTab.tsx` has reached its final size.
- **Across stories**: with two developers, one can take US1 (T015–T020) while the other takes US2 (T021–T025) as soon as Phase 2 closes; they meet at T026.

---

## Parallel Example: User Story 1

```bash
# Three independent presentational components — launch together:
Task: "Create PeriodRangeFilter in src/components/Buggyman/PeriodRangeFilter.tsx"
Task: "Create PeriodTotalsCards in src/components/Buggyman/PeriodTotalsCards.tsx"
Task: "Create PeriodSplitBars in src/components/Buggyman/PeriodSplitBars.tsx"

# Then serialize the wiring:
Task: "Wire all three into src/components/Buggyman/SummaryTab.tsx"
```

## Parallel Example: Phase 2 Foundational

```bash
# Different files, no shared dependencies:
Task: "Add period summary types to src/types/loan.ts"
Task: "Add formatCurrency to src/lib/formatters.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 — verify the endpoint exists (**hard gate**).
2. Phase 2 — data layer and tab shell.
3. Phase 3 — range filter, totals, split bars, states.
4. **STOP and VALIDATE**: quickstart steps 3, 4, and 5.
5. Ship. The dashboard already answers "how much is due, how much came in, how much is still owed, how much is profit" — spec SC-001.

### Incremental Delivery

1. Setup + Foundational → data flows, existing tab unchanged.
2. + US1 → **MVP**, demo-able.
3. + US2 → aggregate becomes an actionable collection list.
4. + US3 → drill-through shortens "who owes" to "what exactly they owe".

Each increment is independently shippable and breaks nothing before it.

---

## Notes

- **The string-money trap is the top defect risk.** Every money field on this endpoint is a two-decimal string. `String.prototype.toLocaleString` silently ignores its options argument, so `"1234.50".toLocaleString('pt-BR', { style: 'currency' })` returns `"1234.50"`, not `R$ 1.234,50`. Always go through `formatCurrency` from T004. If any figure renders as a raw decimal during validation, this is the cause.
- **Never recompute what the endpoint returns.** The contract guarantees the reconciliation identities; summing decimal strings in JS floats will disagree at the cent level (research.md R2). The only derived values are percentages and CSS widths.
- **Deferred, out of scope**: `src/components/LoanCard.tsx:33` renders `LoanSummary` string money through the broken pattern above — a real pre-existing display bug on the loans drawer. It deserves its own task; the `formatCurrency` added in T004 is the fix when someone picks it up. Do not fix it here (Constitution V: changes stay scoped).
- T012's verbatim move is what protects spec SC-010. Resist the urge to tidy the moved code — any cleanup belongs in a separate change.
- Commit after each task or logical group. Stop at any checkpoint to validate a story independently.
