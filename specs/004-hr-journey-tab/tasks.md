---

description: "Task list for HR Journey Tab"
---

# Tasks: HR Journey Tab

**Input**: Design documents from `/specs/004-hr-journey-tab/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/journey-tab-relocation.md, quickstart.md

**Tests**: Not explicitly requested in spec.md. This feature doesn't change `useJourney.ts` or `journeyService.ts` at all (pure UI relocation), so no test updates are required for correctness. Adding coverage for the previously-untested `fetchAdminHistory`/`updateJourney`/`deleteJourney` hook paths is included as an optional Polish task (T013).

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2/P3). Because this feature is a relocation of an already-complete, self-contained component (not new feature code), the Foundational phase delivers the entire move; each user-story phase is a focused verification pass over the slice of functionality that story covers, per `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact and relative to the repository root

## Path Conventions

Single existing frontend project (Vite/React SPA) — all paths under `src/`, per `plan.md`'s Project Structure.

---

## Phase 1: Setup

**Purpose**: No project initialization needed — this is a relocation within an existing, already-configured app (no new dependencies, no new tooling). Nothing to do here; proceed to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The actual relocation — moving journey moderation into the HR page and removing its old standalone entry point. Every user story depends on this being complete, since the moved component already contains all three stories' functionality.

**⚠️ CRITICAL**: No user story verification can begin until this phase is complete.

- [X] T001 [P] Create `src/components/HR/JourneyTab.tsx` containing the full current content of `src/components/Journey/AdminJourney.tsx`, with the component/export renamed from `AdminJourney` to `JourneyTab` (default export, no props, matching the `SalaryTab.tsx`/`LatenessConfigPanel.tsx` convention) — no other logic, JSX, or behavior changes, per `contracts/journey-tab-relocation.md`'s component contract
- [X] T002 Delete `src/components/Journey/AdminJourney.tsx` now that its content lives in `src/components/HR/JourneyTab.tsx` (depends on T001)
- [X] T003 [P] Update `src/components/Layout.tsx`: remove the `{ id: 'admin-journey', label: 'Gerenciar Jornadas', icon: Clock, adminOnly: true }` entry from `menuItems`, and remove the `if (item.id === 'admin-journey') return isSuperAdmin || isHR;` line from `filteredMenuItems`
- [X] T004 [P] Update `src/App.tsx`: remove the `import { AdminJourney } from './components/Journey/AdminJourney';` line and the `case 'admin-journey': return <AdminJourney />;` branch from `renderPage`
- [X] T005 Update `src/components/HR.tsx`: extend the `activeTab` union type to `'employees' | 'salary' | 'journey' | 'lateness'`; import `MapPin` from `lucide-react` and `JourneyTab` from `./HR/JourneyTab`; add a "Jornadas" tab button using the `MapPin` icon, positioned between the existing "Salário" and "Configuração de Atrasos" buttons (so Configuração de Atrasos stays last, per the plan's tab-order decision); render `<JourneyTab />` when `activeTab === 'journey'` in the tab-content switch (depends on T001)

**Checkpoint**: Foundation ready — the "Gerenciar Jornadas" menu entry is gone, and the HR page's new Jornadas tab (3rd, before Configuração de Atrasos) renders the fully-functional relocated component. All three user stories' functionality already exists at this point; the remaining phases verify each slice.

---

## Phase 3: User Story 1 - Manage employee journeys from within the HR page (Priority: P1) 🎯 MVP

**Goal**: Confirm that everything reachable from the old standalone "Gerenciar Jornadas" page (browsing, filtering by employee/date, the delayed-only toggle, selfie viewing) is reachable and correct from the new Jornadas tab, in the right tab position with a distinct icon.

**Independent Test**: Per `quickstart.md` scenarios 1–3 — confirm the old menu entry is gone, confirm tab order/icon, confirm filters and selfie viewing work identically to before.

### Implementation for User Story 1

- [X] T006 [US1] Verify tab structure and navigation: confirm "Gerenciar Jornadas" no longer appears in the sidebar menu, confirm the HR page's tab order is Funcionários → Salário → Jornadas → Configuração de Atrasos (Configuração de Atrasos last), and confirm the Jornadas tab uses a distinct `MapPin` icon (not the `Clock` icon shared with Configuração de Atrasos) — per `quickstart.md` scenario 2
- [X] T007 [US1] Verify data and interaction parity in `src/components/HR/JourneyTab.tsx`: employee filter, date-range filter, "only delayed" toggle (when a lateness config is active), and the selfie viewer all behave exactly as they did in the old standalone page — per `quickstart.md` scenarios 2–3

**Checkpoint**: User Story 1 is fully verified — the Jornadas tab is a complete, correctly-positioned replacement for the old standalone page's browsing/filtering capability.

---

## Phase 4: User Story 2 - Correct a journey record (Priority: P2)

**Goal**: Confirm editing a journey record (date/time, coordinates, required reason) still works identically from within the new tab.

**Independent Test**: Per `quickstart.md` scenario 4 — edit a record's date/time and/or coordinates with a reason and confirm the list reflects the update; confirm saving without a reason is blocked.

### Implementation for User Story 2

- [X] T008 [US2] Verify the edit flow in `src/components/HR/JourneyTab.tsx`: opening the edit modal, the required `edit_reason` field blocking submission when empty, and a successful save updating the record in the list — per `quickstart.md` scenario 4

**Checkpoint**: User Stories 1 AND 2 both verified — browsing/filtering plus record correction.

---

## Phase 5: User Story 3 - Remove an incorrect journey record (Priority: P3)

**Goal**: Confirm deleting a journey record (with confirmation) still works identically from within the new tab.

**Independent Test**: Per `quickstart.md` scenario 5 — delete a record after confirming, confirm it disappears; cancel a delete and confirm the record remains.

### Implementation for User Story 3

- [X] T009 [US3] Verify the delete flow in `src/components/HR/JourneyTab.tsx`: the confirmation prompt, successful deletion removing the record from the list, and cancellation leaving the record in place — per `quickstart.md` scenario 5

**Checkpoint**: All three user stories verified — the Jornadas tab is a complete, behavior-preserving replacement for the old standalone "Gerenciar Jornadas" page.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and full-scope validation once all user stories are verified.

- [X] T010 [P] Grep the repository for any remaining references to `AdminJourney` or `admin-journey` (there should be none outside `specs/004-hr-journey-tab/` after T001–T005) and remove any stragglers found
- [X] T011 Run `npm run lint` and `npm run typecheck` and fix any issues surfaced across `src/components/HR.tsx`, `src/components/HR/JourneyTab.tsx`, `src/components/Layout.tsx`, and `src/App.tsx`
- [ ] T012 Execute all 7 manual validation scenarios in `quickstart.md` against a running `npm run dev` instance, including the non-HR visibility check (scenario 6) and the self-service "Minha Jornada" untouched check (scenario 7) — **not completed**: `VITE_API_URL` in `.env` points to a stale/unreachable ngrok tunnel, so no live backend was available in this environment to log in and click through real data. Verified instead: `npm run build` succeeds, `npm run dev` serves the app with no startup errors, the full Vitest suite (19/19, including 3 new `useJourney` admin-path tests) passes, and the tab order/icon/wiring were confirmed by direct code inspection (T006–T009). Run the 7 quickstart scenarios against a live backend before merging.
- [X] T013 [P] (Optional) Add coverage for `fetchAdminHistory`, `updateJourney`, and `deleteJourney` to `src/hooks/useJourney.test.ts`, following the existing `vi.mock('../services/journeyService')` + `renderHook` conventions already used in that file for `fetchHistory`/`registerJourney` — these paths are exercised by the relocated tab but were not previously covered

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — no tasks.
- **Foundational (Phase 2)**: No dependencies beyond the existing codebase — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (T001–T005) completion. No dependency on US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational completion. Independent of US1/US3 (different interaction within the same already-relocated component).
- **User Story 3 (Phase 5)**: Depends on Foundational completion. Independent of US1/US2.
- **Polish (Phase 6)**: Depends on all desired user stories being verified.

### User Story Dependencies

- **User Story 1 (P1)**: Independently verifiable after Foundational — no dependency on US2/US3.
- **User Story 2 (P2)**: Independently verifiable after Foundational — no dependency on US1/US3.
- **User Story 3 (P3)**: Independently verifiable after Foundational — no dependency on US1/US2.

All three stories are functionally delivered together by the Foundational move (T001–T005), since the relocated component is a single, already-complete unit — their phases are independent *verification* passes, not independent *builds*.

### Within Each User Story

- Each story's tasks are verification-only in this feature; there is no internal ordering beyond "Foundational must be done first."

### Parallel Opportunities

- T001, T003, and T004 (Foundational) touch different files and have no dependency on each other.
- T002 depends on T001 (don't delete the source until its content has been copied).
- T005 depends on T001 (needs `JourneyTab.tsx` to exist to import it), but not on T002–T004.
- T006 and T007 (US1) can be done in either order or together — both are verification against the same already-built component.
- T010 and T013 (Polish) can run in parallel — different files/concerns.

---

## Parallel Example: Foundational

```bash
# T001, T003, and T004 touch different files and have no dependency on each other:
Task: "Create HR/JourneyTab.tsx from AdminJourney.tsx content"
Task: "Remove admin-journey menu entry from Layout.tsx"
Task: "Remove AdminJourney import/case from App.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001–T005) — this alone delivers the entire relocation,
   including removing the old menu entry (FR-001) and adding the correctly-positioned,
   correctly-iconed new tab.
2. Complete Phase 3: User Story 1 verification (T006–T007).
3. **STOP and VALIDATE**: Run `quickstart.md` scenarios 1–3.
4. Because this is a relocation (not new functionality), the MVP is effectively the whole
   feature minus explicit edit/delete verification — but since the moved component already
   contains edit/delete, there's little reason to defer T008/T009 in practice.

### Incremental Delivery

1. Foundational → journey moderation now lives in the HR page; old entry point gone.
2. + User Story 1 verified → browsing/filtering confirmed equivalent.
3. + User Story 2 verified → editing confirmed equivalent.
4. + User Story 3 verified → deleting confirmed equivalent.
5. + Polish → cleanup, lint/typecheck, full quickstart pass, optional hook test coverage.

### Notes

- [P] tasks = different files, no unmet dependencies.
- [Story] label maps each task to its user story for traceability back to `spec.md`.
- No task modifies `src/hooks/useJourney.ts` or `src/services/journeyService.ts` — confirmed unnecessary by the `api-contract-check` hook at spec time and by `research.md`.
- Commit after each task or logical group, per repository convention.
