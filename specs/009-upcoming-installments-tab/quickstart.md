# Quickstart: Validating the Upcoming Installments Tab

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Contracts**: [api.md](./contracts/api.md) · [ui.md](./contracts/ui.md)

How to prove the feature works end to end. Shapes and signatures live in the linked contracts and are not repeated here.

---

## Prerequisites

- Node 18+, dependencies installed (`npm install`)
- `.env` with `VITE_API_URL` pointing at a backend reachable from this machine
- An account with the **super admin** role — the tab is gated on `isSuperAdmin`, same as Resumo (FR-002)
- Seed data with at least: one partner holding a loan with unpaid installments in the next 30 days; one partner with an installment due **before today** and still unpaid; one **partially paid** installment; and one partner with **two** loans

Without that last item, FR-015 (rows not collapsed per partner) cannot be observed.

---

## Automated gates

Run from the repo root. All three must pass before the feature is considered complete.

```bash
npm run lint
npm run typecheck
npx vitest run
```

**Test baseline**: `1 failed | 7 passed` (files), `1 failed | 57 passed` (tests). The failure is `src/hooks/useEmployeePaychecks.test.ts`, which asserts a hardcoded `month: 7` against the current month — pre-existing and unrelated (CLAUDE.md documents it). **Any second failure is caused by this work.**

Targeted runs while iterating:

```bash
npx vitest run src/hooks/useUpcomingInstallments.test.ts
npx vitest run src/lib/formatters.test.ts
```

`npm run build` is not required — this feature touches no build config, dependency, or environment variable.

---

## Manual walkthrough

```bash
npm run dev
```

Sign in as a super admin, open **Bugueiros**.

### 1. The tab exists and is gated — FR-001, FR-002

- A third tab, **A receber**, sits after **Resumo**.
- Sign in as a non-super-admin: neither **Resumo** nor **A receber** is visible. ✅ FR-002

### 2. Loads with no input — FR-003, SC-006

- Click **A receber**. Rows appear with no interaction. ✅ FR-003
- The range defaults to **Próximos 30 dias**, that preset is highlighted, and the overdue switch is **off**. ✅ R-004
- The first screen shows real data, not an empty state. ✅ SC-006

### 3. The table — FR-006 … FR-009, SC-005

- Each row shows due date, partner, installment number, amount, paid, outstanding, status. ✅ FR-006
- Due dates ascend top to bottom. ✅ FR-007
- Every money value is `R$ 0.000,00`, two decimals, zeros shown as `R$ 0,00`. ✅ FR-008
- On any row, paid + outstanding = amount, by eye. ✅ SC-005
- The partially paid row is visibly distinct from untouched rows and shows both figures. ✅ FR-009
- No fully paid installment appears anywhere. ✅ FR-014, SC-003

### 4. One partner, several loans — FR-015

- The two-loan partner appears in as many rows as they have unsettled installments — not collapsed into one. ✅ FR-015

### 5. The overdue switch — FR-020, FR-021, FR-010, FR-011

- Switch **off**: every due date falls inside the range. ✅ FR-020
- Turn it **on**: the pre-range unpaid installment appears, at the top (oldest first). ✅ FR-021
- Overdue rows carry a marker plus how long they are overdue — identifiable without reading dates. ✅ FR-010, SC-004
- Turn it **off**: those rows go, the dates are unchanged. ✅ US2 scenario 5
- **The subtle one**: set a range starting a month ago with the switch **off**. In-range rows already past due still show as overdue — the flag is the server's, not a range comparison. ✅ FR-011
- Find an installment due **today**: not marked overdue. ✅ FR-011, US2 scenario 7

### 6. Counts and totals — FR-012, FR-013

- The summary bar shows the row count and total outstanding; the count matches the visible rows. ✅ FR-012
- Toggle overdue on with a long history: the count makes the larger result legible rather than surprising. ✅ US2 scenario 4
- Cross-check the total by hand against a few rows' outstanding amounts (watch for a stray trailing cent — that would mean the cents-based sum of R-002 was skipped).
- Nothing on screen invites comparing this total to the Resumo tab's. ✅ FR-013

### 7. Filters and states — FR-019, FR-022, FR-023, FR-024

- Set the end date **before** the start: an inline warning appears, and the Network tab shows **no request**. ✅ FR-019
- Change the range to one with data: rows refresh; no row from the previous range survives. ✅ FR-022
- Pick a far-future range with nothing due: an explicit empty state, clearly not the skeleton and not an error. ✅ FR-023
- Stop the backend and hit refresh: an error message with **Tentar novamente**, still on the tab; restart the backend, click it, rows return. ✅ FR-024

### 8. Drill-through — FR-025, FR-026

- Click a partner name: their loan drawer opens on the right loan. ✅ FR-025
- **Parity check**: with the drawer open, compare that partner's unsettled installments against the rows the list shows for them in the active range. Every unpaid installment falling in the range appears in the list, with matching amounts, and nothing the drawer shows as fully paid appears. Zero discrepancies. ✅ SC-009
- Close it: same range, same overdue setting, same rows. ✅ US3 scenario 2
- Register a **partial** payment on a listed installment, close, refresh: the row stays, paid up, outstanding down. ✅ FR-026
- Register a payment that **fully settles** an installment, close, refresh: the row is gone. ✅ FR-014, FR-026

### 9. Persistence across tabs — FR-004, FR-005

- Set a custom range, turn overdue on, switch to **Bugueiros**, come back: range, switch and rows are all as you left them. ✅ FR-004
- **Bugueiros** and **Resumo** behave exactly as before this feature. ✅ FR-005

### 10. Responsive — FR-016, SC-008

- Narrow the window below `sm`: the table becomes the stacked card list, carrying the same fields and markers.
- At desktop width with many rows: the table scrolls **inside its own container**; the page never scrolls sideways. ✅ FR-016
- Scroll down a long list: column headers stay visible. ✅ SC-008
- Turn overdue on for the largest possible history and scroll — rendering stays responsive. ✅ SC-008

---

## Acceptance summary

Feature is done when:

- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npx vitest run` shows exactly the baseline failure, no more
- [ ] All ten sections above pass
- [ ] Every FR in [spec.md](./spec.md) maps to an observed behavior
- [ ] No `console.log`, `debugger`, or `alert` in the new code (constitution: Development Workflow & Quality Gates)

## Where to look when something is wrong

| Symptom | Likely cause |
|---|---|
| Total shows a stray trailing cent | Floats summed directly instead of integer cents — R-002 |
| Overdue markers disagree with the server | `is_overdue` recomputed client-side instead of trusted — R-003, FR-011 |
| A `400` appears in the Network tab | Inverted-range guard missing from the hook — FR-019 |
| Money renders as `"1234.50"` unformatted | `formatCurrency` skipped; `toLocaleString` on a string is a no-op — see its doc comment |
| Date off by one near midnight | `toISOString()` used instead of `toISODateLocal` |
| Filters reset when returning to the tab | The tab is unmounting; the visited-set in `Buggyman.tsx` is wrong — R-006, FR-004 |
| Empty state flashes during first load | `isEmpty` derived from `length === 0` instead of loaded-and-empty — data-model.md |
| Stale rows appear after fast filter changes | Request-id guard missing — ui.md hook clause 6 |
