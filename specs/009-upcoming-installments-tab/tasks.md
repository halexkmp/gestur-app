---

description: "Task list for the Upcoming Installments Tab feature"
---

# Tasks: Upcoming Installments Tab

**Input**: Design documents from `/specs/009-upcoming-installments-tab/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), [contracts/ui.md](./contracts/ui.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The spec did not request tests, but [research.md](./research.md) R-009 decided on hook + formatter unit tests, following feature 008's precedent (`useLoanPeriodSummary.test.ts`) and the constitution's rule that already-tested areas stay runnable. No component tests — there is no precedent for them in this repo.

**Organization**: Grouped by user story so each can be implemented, tested, and shipped independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete work)
- **[Story]**: Which user story the task serves (US1, US2, US3)
- Exact file paths are given in every task

## Path Conventions

Single-project React SPA. All source under `src/` at the repository root, following the layering in [plan.md](./plan.md): `types/` → `services/` → `hooks/` → `components/`.

---

## Phase 1: Setup

**Purpose**: Establish the baseline this work will be measured against. No project initialization is needed — the stack, tooling, and folder structure all already exist, and no dependency is added.

- [X] T001 Record the pre-work baseline by running `npm run lint`, `npm run typecheck`, and `npx vitest run` from the repo root. **Measured baseline (2026-08-10) — lint and typecheck are NOT clean, contrary to this task's original assumption:** lint `40 problems (37 errors, 3 warnings)` across 15 files; typecheck `12 errors`; tests `1 failed | 7 passed` (files) / `1 failed | 57 passed` (tests). None of the lint or typecheck errors are in files this feature touches, so the gate for later checkpoints is **no increase** on any of the three counts, not zero.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The type and service layer every user story reads through.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `UpcomingInstallment`, `UpcomingInstallmentStatus`, and `UpcomingInstallmentsParams` to `src/types/loan.ts` per [data-model.md](./data-model.md). Define `UpcomingInstallmentStatus` as `Exclude<InstallmentStatus, 'PAID'>` (derive from the existing union — do not redeclare the literals). Type all three money fields as `string`, not `number`. Include the unused-but-documented optional `partner_id` and `limit` on the params type. Add a doc comment on `UpcomingInstallment` pointing at `specs/api/loans.md`, matching the style of the existing `LoanPeriodSummary` comment. No change to `src/types/index.ts` is needed — `export * from './loan'` already covers it.
- [X] T003 Add `getUpcomingInstallments(params: UpcomingInstallmentsParams): Promise<UpcomingInstallment[]>` to `src/services/loanService.ts`, calling `api.get<UpcomingInstallment[]>('/loans/upcoming-installments', { params })`. Place it directly after `getPeriodSummary` and add the new types to the existing `../types` import. Return the array exactly as received — no sorting, filtering, or reshaping; the server's order is the contract (FR-007). Depends on T002.

**Checkpoint**: `npm run typecheck` passes. The data layer is reachable; user stories can begin.

---

## Phase 3: User Story 1 - See what is coming due (Priority: P1) 🎯 MVP

**Goal**: A third tab on the Bugueiros page that loads on selection with no input and lists every installment still owed in a date range — due date, partner, installment number, amount, paid, outstanding, status — ordered by due date, with working loading/empty/error states and a row count and outstanding total.

**Independent Test**: Sign in as a super admin, open Bugueiros → **A receber**. Rows appear with no interaction, defaulted to the next 30 days. Every row shows all seven fields, due dates ascend, money is formatted to two decimals, and paid + outstanding = amount on each row. Change the range and the list re-scopes. Invert the range and an inline warning appears with no request issued. This delivers the whole point of the feature — replacing per-partner manual tallying — with no dependency on US2 or US3.

### Tests for User Story 1

> The hook's behavioral contract in [contracts/ui.md](./contracts/ui.md) is precise enough to write these against before the implementation exists. `useLoanPeriodSummary.test.ts` is the direct template — copy its structure.

- [X] T004 [US1] Create `src/hooks/useUpcomingInstallments.test.ts` covering hook contract clauses 1, 2, 3, 6, 7, 8, 9 and the `totalOutstanding` half of 10 from [contracts/ui.md](./contracts/ui.md): defaults to the `next-30-days` range and fetches on mount with the expected params; does not fetch while the range is inverted and leaves previously loaded rows on screen; discards a stale response that resolves after a newer one; surfaces `err.message` on failure; `installments` is `null` before first success and `isEmpty` is true only when loaded-and-empty; `totalOutstanding` sums correctly. Mock with `vi.mock('../services/loanService')`. **Derive expected ranges at runtime via `periodPresetRange('next-30-days')` — do not use fake timers**, which stall `waitFor`'s polling (the reason is commented at the top of `useLoanPeriodSummary.test.ts`). Include at least one `totalOutstanding` case whose values expose float drift (e.g. `"0.10"`, `"0.20"`) and assert the exact expected total. These tests fail until T005.

### Implementation for User Story 1

- [X] T005 [US1] Create `src/hooks/useUpcomingInstallments.ts` implementing the interface and clauses 1–3 and 6–10 in [contracts/ui.md](./contracts/ui.md). Copy the structure of `src/hooks/useLoanPeriodSummary.ts` — the `requestIdRef` staleness guard, the `hasDataRef` loading/refreshing split, the `endDate < startDate` early return, the `setRange`/`applyPreset` pair — changing: `DEFAULT_PRESET` to `'next-30-days'` (R-004), state to `UpcomingInstallment[] | null`, the service call to `loanService.getUpcomingInstallments`, and the error fallback string to `'Não foi possível carregar as parcelas.'`. Add derived `rowCount`, `isEmpty` (loaded **and** empty — not `length === 0`, which would flash the empty state during first load), and `totalOutstanding` summed in **integer cents** per R-002: `Math.round(Number(v) * 100)` accumulated as integers, divided by 100 once at the end. Pass `include_overdue: false` as a **literal** in the params object — R-001 and [contracts/api.md](./contracts/api.md) require it sent explicitly in both states, so the MVP must not fall back to the server default; T017 replaces the literal with state. Leave the `includeOverdue` state and `overdueCount` out — they arrive in US2. Makes T004 pass.
- [X] T006 [P] [US1] Create `src/components/Buggyman/UpcomingTabStates.tsx` with the props in [contracts/ui.md](./contracts/ui.md), minus `includeOverdue` (added in US2). Three visually distinct states (FR-023, FR-024): error (message + a "Tentar novamente" button calling `onRetry`), loading (a skeleton shaped like *this* tab's table — header strip plus repeated row bars — so nothing shifts when data lands), and empty ("Nenhuma parcela a receber neste período."). Follow `SummaryTabStates.tsx`'s structure and Tailwind classes; do not modify or import from it (the duplication is deliberate — see [contracts/ui.md](./contracts/ui.md)).
- [X] T007 [P] [US1] Create `src/components/Buggyman/UpcomingSummaryBar.tsx` taking exactly `rowCount` and `totalOutstanding` — these are its only props, in US1 and after. Render the row count and the outstanding total via `formatCurrency` from `src/lib/formatters.ts`, labelled as belonging to the listed rows (e.g. "N parcela(s) · Total em aberto R$ X"). Per FR-013 and R-005, do **not** label, caption, or position this so as to invite comparison with the Resumo tab, and do not reference that tab. `overdueCount` does not belong here — it lives beside the switch in `UpcomingFiltersBar` (T018).
- [X] T008 [P] [US1] Create `src/components/Buggyman/UpcomingInstallmentsTable.tsx` — the `sm`-and-up table, props per [contracts/ui.md](./contracts/ui.md). Columns in order: Vencimento · Bugueiro · Parcela · Valor · Pago · Em aberto · Situação. Wrapper `hidden sm:block overflow-x-auto` with `sticky top-0` on the header row (SC-008, FR-016). Key rows by `installment_id`. Render in received order — **no sortable headers and no search box**, unlike `PartnerBreakdownTable`; FR-017 fixes the controls at two filters. Money via `formatCurrency`, dates via `formatDateBR`. Distinguish `PARTIALLY_PAID` from `PENDING` in the Situação column (FR-009). Render the partner name as plain text for now — it becomes a button in US3. Follow `PartnerBreakdownTable.tsx`'s Tailwind conventions for header, cell, and hover styling.
- [X] T009 [P] [US1] Create `src/components/Buggyman/UpcomingInstallmentsCards.tsx` — the `sm:hidden` stacked list carrying the same fields and the same partial-payment distinction, following `PartnerBreakdownCards.tsx`. Key by `installment_id`. Partner name as plain text for now (US3 makes it interactive).
- [X] T010 [US1] Create `src/components/Buggyman/UpcomingFiltersBar.tsx` with the props from [contracts/ui.md](./contracts/ui.md) minus `includeOverdue`/`overdueCount`/`onIncludeOverdueChange` (added in US2): the "Vencimentos de {start} a {end}" caption using `formatDateBR`, and a refresh button disabled on `disabled`, spinning while `refreshing`. Lift this from the equivalent inline row in `SummaryTab.tsx` lines 42–61.
- [X] T011 [US1] Create `src/components/Buggyman/UpcomingTab.tsx` — the orchestrator, no props. Call `useUpcomingInstallments`, render `PeriodRangeFilter` (imported unchanged from `./PeriodRangeFilter`, wired to `startDate`/`endDate`/`preset`/`invalidRange`/`applyPreset`/`setRange`), then `UpcomingFiltersBar`, then either `UpcomingTabStates` or the populated view (`UpcomingSummaryBar` + `UpcomingInstallmentsTable` + `UpcomingInstallmentsCards`), applying the `refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'` dimming used by `SummaryTab`. Mirror `SummaryTab.tsx` closely enough that the two files diff cleanly. Depends on T005–T010.
- [X] T012 [US1] Modify `src/components/Buggyman.tsx`: extend `BuggymanTab` with `'upcoming'`, replace the `summaryVisited` boolean with a `Set<BuggymanTab>` of visited tabs per R-006 (preserving the mount-once-then-hide behavior and its explanatory comment — that behavior is what makes FR-004 work), and add an **A receber** tab button with the `CalendarClock` icon from `lucide-react`, placed after **Resumo** and gated on `isSuperAdmin` exactly as Resumo is (FR-002). Render `UpcomingTab` behind the same visited-and-hidden pattern. The `partners` and `summary` tabs must render identically to before (FR-005).
- [ ] T013 [US1] Verify User Story 1 against [quickstart.md](./quickstart.md) sections 1, 2, 3, 4, 7 and 9, and confirm `npm run lint`, `npm run typecheck`, and `npx vitest run` hold at the T001 baseline (the new hook tests now passing, still exactly one pre-existing failure). **Automated half DONE** (lint 40→40, typecheck 12→12, tests 1 failed/67 passed at this checkpoint). **Manual half BLOCKED**: no backend is reachable — `.env` has `VITE_API_URL` commented out and `localhost:3000` does not respond, so the app cannot get past login. Requires the user to run it against a live backend with seeded data.

**Checkpoint**: The tab is fully functional and shippable on its own. US2 and US3 are additive.

---

## Phase 4: User Story 2 - Pull in what is already overdue (Priority: P2)

**Goal**: A single switch that additionally pulls in every installment still owed from before the range, with overdue rows unmistakably marked and their age visible.

**Independent Test**: With unpaid installments dated before the selected range, turn the switch on — those rows appear, marked overdue with how long they are overdue, sorted to the top by due date. Turn it off — they disappear, dates unchanged. Set a range starting a month ago with the switch off: in-range rows that are already past due still show as overdue, proving the marking follows the server's flag rather than the range boundaries.

### Tests for User Story 2

- [X] T014 [P] [US2] Add `daysOverdue` cases to `src/lib/formatters.test.ts`: a past date returns the correct whole-day count; **today returns 0**; a future date returns 0 (never negative); a date spanning a DST transition still returns whole days. Freeze time with fake timers here — this file already does so for `periodPresetRange`, and unlike the hook tests there is no `waitFor` to stall. Fails until T015.
- [X] T015 [P] [US2] Extend `src/hooks/useUpcomingInstallments.test.ts` with contract clauses 4, 5 and the `overdueCount` half of 10: `include_overdue` is sent explicitly as `false` on the initial fetch and as `true` after toggling (assert the exact params object both times — per R-001 a boolean `false` survives `api.ts`'s param guard and must not be omitted); toggling refetches; `setIncludeOverdue` leaves the dates untouched and `setRange`/`applyPreset` leave `includeOverdue` untouched; `overdueCount` counts only rows with `is_overdue === true`. Fails until T016/T017.

### Implementation for User Story 2

- [X] T016 [P] [US2] Add `daysOverdue(dueDate: string): number` to `src/lib/formatters.ts` per R-003 — whole days a `YYYY-MM-DD` date is in the past, `0` for today or any future date, never negative. Anchor **both** the due date and today at local noon before diffing, the technique `formatDateBR` already uses on the line above, which is what keeps whole-day arithmetic correct across DST. Additive only; change nothing existing in this file. Makes T014 pass.
- [X] T017 [US2] Extend `src/hooks/useUpcomingInstallments.ts` with `includeOverdue` state (initial `false`), a `setIncludeOverdue` setter, `includeOverdue` in the `fetchInstallments` dependency array so a toggle refetches, `include_overdue` passed explicitly in the params object in both states (R-001), and a derived `overdueCount`. Keep the filter axes independent: `setIncludeOverdue` must not touch the dates, and `setRange`/`applyPreset` must not touch `includeOverdue`. Makes T015 pass.
- [X] T018 [US2] Add the overdue switch to `src/components/Buggyman/UpcomingFiltersBar.tsx` — the `includeOverdue`, `overdueCount` and `onIncludeOverdueChange` props from [contracts/ui.md](./contracts/ui.md). A labelled control (e.g. "Incluir parcelas vencidas"), not an icon-only toggle, stating what it does when on. Surface `overdueCount` beside it so the size of what the switch pulls in is visible before and after flipping it.
- [X] T019 [P] [US2] Mark overdue rows in `src/components/Buggyman/UpcomingInstallmentsTable.tsx`, driven **solely by the row's `is_overdue` flag** — never by comparing `due_date` to the selected range (FR-011, R-003). Use a persistent marker (badge or icon plus text), not colour alone, so overdue rows are identifiable without reading dates (SC-004); pair it with `daysOverdue(row.due_date)` rendered as e.g. "vencida há N dia(s)" (FR-010). An installment due today must show neither.
- [X] T020 [P] [US2] Apply the same `is_overdue`-driven marker and `daysOverdue` text to `src/components/Buggyman/UpcomingInstallmentsCards.tsx`, so the mobile layout carries identical information (FR-016).
- [X] T021 [US2] Add the `includeOverdue` prop to `src/components/Buggyman/UpcomingTabStates.tsx` and make the empty-state copy aware of it: with the switch off, suggest turning it on to see overdue items; with it on, state plainly that nothing is owed in this period — that is the complete answer and there is nothing further to suggest.
- [X] T022 [US2] Wire the new props through `src/components/Buggyman/UpcomingTab.tsx` — the only file this task touches: `includeOverdue`/`overdueCount`/`setIncludeOverdue` into `UpcomingFiltersBar`, and `includeOverdue` into `UpcomingTabStates`. `UpcomingSummaryBar` is unchanged by US2 — `overdueCount` is rendered once, next to the switch that produces it.
- [ ] T023 [US2] Verify User Story 2 against [quickstart.md](./quickstart.md) sections 5 and 6 — including the two subtle checks: a past-starting range with the switch **off** still marks already-due rows overdue, and an installment due **today** is not marked. Re-run the three gates against the T001 baseline. **Automated half DONE** (lint 40→40, typecheck 12→12, tests 1 failed/79 passed). **Manual half BLOCKED** on backend availability, as T013. Note that the "due today is not overdue" boundary *is* covered automatically by `daysOverdue` unit tests in `src/lib/formatters.test.ts`; what remains unverified is the end-to-end rendering.

**Checkpoint**: US1 and US2 both work independently. The tab is a complete collection list.

---

## Phase 5: User Story 3 - Act on a row (Priority: P3)

**Goal**: Open a row's partner loan detail from the list, register payment there, and return with filters and rows intact.

**Independent Test**: Click a partner name in the list — their loan drawer opens on the right loan. Close it: the same range, overdue setting and rows are still there. Register a partial payment and refresh: the row stays with updated amounts. Register a payment that fully settles an installment and refresh: the row is gone.

### Implementation for User Story 3

> No new tests. This story adds no new logic — it reuses `usePartnerLoanDrawer` and `LoanDrawer` wholesale, and the one code change is a type-level widening with no runtime effect (R-007).

- [X] T024 [US3] Widen `openFor`'s parameter in `src/hooks/usePartnerLoanDrawer.ts` from `LoanPeriodSummaryPartner` to `{ partner_id: string }` and drop the now-unused `LoanPeriodSummaryPartner` import. The body already reads only `row.partner_id`, so nothing else changes. **Do not modify `src/components/Buggyman/SummaryTab.tsx`** — `LoanPeriodSummaryPartner` stays structurally assignable, so its call site compiles and behaves identically. Confirm with `npm run typecheck`.
- [X] T025 [P] [US3] Make the partner name a button in `src/components/Buggyman/UpcomingInstallmentsTable.tsx`, invoking the new `onSelectPartner` prop with the row. Style it like `PartnerBreakdownTable.tsx`'s partner button (`font-medium text-gray-900 hover:text-blue-600 hover:underline text-left`).
- [X] T026 [P] [US3] Add the same `onSelectPartner` interaction to `src/components/Buggyman/UpcomingInstallmentsCards.tsx`, following `PartnerBreakdownCards.tsx`'s tappable-card pattern.
- [X] T027 [US3] Wire drill-through into `src/components/Buggyman/UpcomingTab.tsx`: call `usePartnerLoanDrawer`, pass `openFor` as `onSelectPartner` to the table and cards, render `<LoanDrawer isOpen={!!drawerPartner} onClose={close} partner={drawerPartner} />`, and show the `resolving` spinner in the filters bar caption as `SummaryTab.tsx` does. Because the tab stays mounted, filters and rows survive the drawer automatically — no state needs saving.
- [ ] T028 [US3] Verify User Story 3 against [quickstart.md](./quickstart.md) section 8, including both payment paths: a partial payment leaves the row with updated amounts, and a fully settling payment removes it (FR-014, FR-026). Confirm the Resumo tab's drill-through still works after T024. **Automated half DONE** — `git diff` confirms `SummaryTab.tsx` is byte-identical after the T024 widening, so the Resumo drill-through call site is provably unchanged, and typecheck passes. **Manual half BLOCKED** on backend availability, as T013.

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T029 **BLOCKED — requires the user.** Run the full [quickstart.md](./quickstart.md) manual walkthrough end to end — all ten sections, not only the per-story subsets at T013/T023/T028 — confirming every FR in [spec.md](./spec.md) maps to an observed behavior. Cannot be executed here: no backend is reachable (`VITE_API_URL` is commented out in `.env`; `localhost:3000` does not respond), and the app requires a login round trip plus seeded loan data before the tab shows anything.
- [ ] T030 [P] **BLOCKED — requires the user.** Verify responsiveness and scale per quickstart section 10: below `sm` the table becomes the card list; at desktop width the table scrolls inside its own container with the page never scrolling sideways; column headers stay visible while scrolling a long list; and rendering stays responsive with the overdue switch on over the largest available history. The implementing classes are in place and reviewable (`hidden sm:block overflow-x-auto max-h-[70vh]` with `sticky top-0` on the header in `UpcomingInstallmentsTable.tsx`; `sm:hidden` in `UpcomingInstallmentsCards.tsx`), but visual confirmation needs a running app.
- [X] T031 [P] Confirm no `console.log`, `debugger`, or `alert` remains in any file added or modified by this feature (constitution: Development Workflow & Quality Gates).
- [X] T032 Run `npm run lint`, `npm run typecheck`, and `npx vitest run`. Lint and typecheck must be clean; the test run must show **exactly** the T001 baseline failure (`useEmployeePaychecks.test.ts`) and nothing more, with the new `useUpcomingInstallments` and `daysOverdue` tests passing. `npm run build` is not required — no build config, dependency, or environment variable is touched.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. **Blocks all user stories.**
- **US1 (Phase 3)**: Depends on Foundational. No dependency on US2 or US3.
- **US2 (Phase 4)**: Depends on Foundational; **modifies files created in US1**, so in practice follows it. See the note below.
- **US3 (Phase 5)**: Depends on Foundational; **modifies files created in US1**, so in practice follows it. Independent of US2.
- **Polish (Phase 6)**: Depends on every story being delivered.

### Story independence — an honest caveat

The stories are independently *testable and deliverable* in the sense the template intends: each is a shippable increment, and stopping after any one leaves a coherent product. They are **not** independently *developable in parallel by different people*, because US2 and US3 both extend components that US1 creates (`UpcomingInstallmentsTable`, `UpcomingInstallmentsCards`, `UpcomingTab`). Two developers taking US2 and US3 simultaneously after US1 would collide in those three files.

This is inherent to a single-tab UI feature, not a flaw in the decomposition. Run the stories sequentially.

If you are implementing straight through to all three stories in one pass rather than shipping incrementally, T019/T020 can be folded into T008/T009, and T025/T026 into T008/T009 as well, avoiding two extra passes over the table and card components. Keep them separate if you intend to ship US1 on its own.

### Within Each User Story

- Tests before implementation (T004 before T005; T014/T015 before T016/T017).
- Hook before the components that consume it.
- Leaf components before the orchestrator that composes them (T006–T010 before T011).
- The orchestrator before the page wiring (T011 before T012).

### Parallel Opportunities

- **Phase 2**: none — T003 depends on T002.
- **US1**: T006, T007, T008, T009 are four separate new files with no interdependency — the largest parallel block in the feature. T010 is sequential only because it lifts markup out of `SummaryTab.tsx` and is quick.
- **US2**: T014+T016 (formatter) and T015+T017 (hook) are two independent tracks in different files. T019 and T020 are parallel to each other; both need T016 first.
- **US3**: T025 and T026 are parallel; both need T024.
- **Polish**: T030 and T031 are parallel.

---

## Parallel Example: User Story 1

```bash
# After T005 (the hook) lands, the four presentational components are
# independent — different files, no shared edits:
Task: "Create UpcomingTabStates in src/components/Buggyman/UpcomingTabStates.tsx"
Task: "Create UpcomingSummaryBar in src/components/Buggyman/UpcomingSummaryBar.tsx"
Task: "Create UpcomingInstallmentsTable in src/components/Buggyman/UpcomingInstallmentsTable.tsx"
Task: "Create UpcomingInstallmentsCards in src/components/Buggyman/UpcomingInstallmentsCards.tsx"
```

## Parallel Example: User Story 2

```bash
# Two independent tracks — the formatter and the hook touch different files:
Task: "Add daysOverdue to src/lib/formatters.ts + cases in src/lib/formatters.test.ts"
Task: "Add includeOverdue/overdueCount to src/hooks/useUpcomingInstallments.ts + tests"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 (T001) — baseline.
2. Phase 2 (T002–T003) — types and service. Blocks everything.
3. Phase 3 (T004–T013) — the tab.
4. **STOP and VALIDATE** against quickstart sections 1, 2, 3, 4, 7, 9.

That is a complete, useful feature: the forward-looking collection list that replaces per-partner manual tallying. It ships without an overdue switch and without drill-through.

### Incremental Delivery

1. Setup + Foundational → data layer reachable.
2. + US1 → **MVP**, demo-able.
3. + US2 → the full collection picture, overdue included.
4. + US3 → a working surface rather than a reading one.

Each increment leaves the previous one intact.

### Risk Notes

The three places this is most likely to go quietly wrong, all called out in [research.md](./research.md):

- **T005** — summing money as floats instead of integer cents surfaces a stray trailing cent in the total once a few hundred rows are listed (R-002).
- **T019/T020** — recomputing overdue from the selected range instead of trusting the server's `is_overdue` flag produces markers that disagree with the backend across timezone boundaries and on past-starting ranges (R-003, FR-011).
- **T012** — getting the visited-set wrong unmounts the tab on every switch, silently resetting filters and breaking FR-004.

[quickstart.md](./quickstart.md) ends with a symptom-to-cause table covering these and five more.

---

## Implementation notes (recorded during execution)

- **One file was added beyond the plan**: `src/components/Buggyman/InstallmentStatusCell.tsx` (48 lines), created between T018 and T019. T019 and T020 would otherwise have duplicated the overdue badge, day count, and status badge across the table and the card list, and the addition would have pushed `UpcomingInstallmentsTable.tsx` toward the 150-line ceiling. This is the extraction the analyze pass anticipated as finding **F4**, executed at its stated trigger. Result: the table settled at 93 lines, cards at 58, and the overdue/status rendering is defined once.
- **T001 found the baseline was not clean.** The plan assumed lint and typecheck passed; they do not (40 lint problems, 12 typecheck errors, all pre-existing and none in files this feature touches). The gate was therefore "no increase", and the final measurement matched the baseline exactly on both.
- **Five tasks could not be executed**: T013, T023, T028 (manual halves), T029 and T030 in full. All are manual verification requiring a running app against a live backend, which is not available in this environment. Their automated halves passed.

## Notes

- `[P]` = different files, no dependency on incomplete work.
- `[Story]` labels map tasks to spec.md user stories for traceability.
- Commit after each task or logical group.
- The test baseline is `1 failed | 7 passed`. That one failure is pre-existing and date-dependent (`useEmployeePaychecks.test.ts`). **A second failure is yours.**
- No new dependency is introduced anywhere in this feature. Virtualization, decimal, and date libraries were each considered and rejected (R-002, R-003, R-008).
