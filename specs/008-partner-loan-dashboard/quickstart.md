# Quickstart: Partner Loan Period Dashboard

How to run and validate this feature end to end. Each scenario maps back to the acceptance criteria in [spec.md](./spec.md).

---

## Prerequisites

- Backend running and reachable via `VITE_API_URL` (defaults to `http://localhost:8000`).
- A user account with the **ADMIN** role — the summary tab is gated on `isSuperAdmin`.
- Seed data in the backend: at least three buggyman partners with active loans whose installments fall in the current month, including
  - one partner with **two** loans due in the same period,
  - one partner whose installments in the period are **fully paid**,
  - one **inactive** partner still carrying debt,
  - one **canceled** loan (must not appear anywhere).

```bash
npm install
npm run dev          # Vite dev server
```

---

## Step 1 — Verify the endpoint exists (do this first)

The feature depends entirely on `GET /loans/period-summary`, which is documented but **not yet verified live** — see [contracts/loan-period-summary.md](./contracts/loan-period-summary.md). Nothing else should be implemented until this passes.

```bash
TOKEN=<paste a valid access token>
curl -s -H "Authorization: Bearer $TOKEN" \
  "$VITE_API_URL/loans/period-summary?start_date=2026-08-01&end_date=2026-08-31" | jq
```

Expected: `200` with the documented shape. Confirm specifically that

- every money field is a **string** with two decimals (`"1234.50"`, `"0.00"`) — not a number;
- `expected_capital + expected_profit == expected_revenue`;
- `received_amount + outstanding_amount == expected_revenue`.

Then work through the full verification checklist at the bottom of the contract file (empty range → `200`, inverted range → `400`, inactive partner present, multi-loan partner appearing once) and record the results there.

**If the endpoint 404s**, stop: the feature is blocked on the backend. Nothing in the plan changes, only the timing.

---

## Step 2 — Quality gates

```bash
npm run lint
npm run typecheck
npx vitest run
```

**Baseline on this branch: 41 passing, 1 failing.** The failure is in `useEmployeePaychecks.test.ts` and is pre-existing and unrelated — do not attribute it to this feature. Anything beyond that one is a regression.

Run just this feature's hook test:

```bash
npx vitest run src/hooks/useLoanPeriodSummary.test.ts
```

---

## Step 3 — Access control

| Check | Expected | Spec ref |
|---|---|---|
| Sign in as ADMIN, open **Bugueiros** | Two tabs visible: partner list and summary | FR-001 |
| Sign in as a non-admin who can reach Bugueiros | Summary tab **not rendered at all** — not disabled, not an "access denied" panel | FR-003 |
| Open Bugueiros fresh as ADMIN | Partner list tab is active on entry | FR-002 |

---

## Step 4 — No regression on the existing tab (spec SC-010)

The partner list moved verbatim into `Buggyman/PartnersTab.tsx`. Confirm each still works exactly as before:

- name search filters the cards;
- "Apenas com empréstimos" checkbox filters correctly;
- **Novo Bugueiro** creates;
- pencil icon edits (name + PIX key prefilled);
- trash icon deletes after the confirm dialog;
- coin icon opens `LoanDrawer` for that partner (ADMIN only).

---

## Step 5 — User Story 1: period totals (P1)

| Action | Expected | Spec ref |
|---|---|---|
| Select the summary tab | Loads immediately for the current calendar month with no input needed | FR-006 |
| Select the summary tab with DevTools Network open | Figures readable within **2 seconds** of the tab activating | SC-003 |
| Change the range with DevTools Network open | All figures updated within **2 seconds** of the change | SC-004 |
| Read the headline | Expected revenue, returned capital, profit, received, outstanding — all in `R$ 1.234,56` format, plus installment and partner counts | FR-011, FR-012, FR-013 |
| **Check formatting carefully** | No figure renders as a raw `1234.50`. That symptom means string money reached `toLocaleString` without `Number()` coercion — see research.md R1 | FR-013 |
| Read the labels | Revenue is described as scheduled by **due date** in the period, not as transacted in the period | FR-014 |
| Read the split visuals | Capital+profit and received+outstanding bars visibly reconcile to expected revenue | FR-015 |
| Read the collection percentage | Received as a whole percent of expected revenue | FR-016 |
| Switch to previous month | Every figure updates together; no figure from the old range remains | FR-010, SC-004 |
| Change range with data on screen | Refresh is visibly indicated; layout does not jump | FR-029, FR-026 |
| Pick a far-future range with nothing due | Explicit "nothing due in this period" state — distinct from loading and from error; the percentage shows `—`, never `0%` or `NaN%` | FR-027, FR-016, SC-006 |
| Stop the backend, then change range | Error state with a working retry that does not reload the page | FR-028 |
| Set end date before start date | Inline validation message; **no network request fires** (confirm in the Network tab); previously loaded figures stay on screen | FR-008, SC-008 |
| Change the range rapidly several times | Only the newest range's figures land; a slow earlier response never overwrites | SC-004 |

---

## Step 6 — User Story 2: per-partner breakdown (P2)

| Action | Expected | Spec ref |
|---|---|---|
| Scroll to the breakdown | Each partner once, with name, installment count, scheduled, received, outstanding | FR-018, FR-019 |
| Check the multi-loan partner | Appears **once**, amounts combined — not two rows | FR-019 |
| Check the default order | Largest scheduled amount first; ties alphabetical | FR-020, SC-005 |
| Add up the rows | Scheduled sums to expected revenue; received sums to the received total | User Story 2 scenario 3 |
| Check the fully-paid partner | Zero outstanding, marked as settled, **still listed** | FR-023 |
| Check the inactive partner | Present in the list | Contract selection rules |
| Check the canceled loan's partner | Absent, unless they have other non-canceled loans due | Contract selection rules |
| Sort by outstanding, then by name | Re-orders correctly | FR-021 |
| Type a partial partner name | Rows narrow; **headline totals do not change** | FR-022 |
| Narrow to 360px | No horizontal page scroll; the table reflows to stacked cards | FR-024, SC-007 |

---

## Step 7 — User Story 3: drill-through (P3)

| Action | Expected | Spec ref |
|---|---|---|
| Activate a partner row | Existing `LoanDrawer` opens for that partner | FR-025 |
| Check the drawer header | Correct partner name and correct Ativo/Inativo badge — the badge comes from a real `Partner`, never a fabricated one | research.md R10 |
| Close the drawer | Back on the summary tab, same range applied, data still loaded — no refetch flash | FR-025 |
| Activate the inactive partner's row | Drawer still opens | User Story 3 scenario 3 |
| Tab to a row and press Enter | Row activates from the keyboard (rows are real buttons) | FR-025 |

---

## Step 8 — Cross-cutting

| Check | Expected | Spec ref |
|---|---|---|
| All visible copy | Brazilian Portuguese throughout | FR-030 |
| Switch tabs and back | Selected date range survives | FR-004 |
| Browser console | No `console.log`, no `alert()`; errors render in the UI | Constitution: Workflow & Quality Gates |
| Range boundary near midnight | Late in the evening on the last day of a month, "Mês atual" still resolves to the **local** month — not next month | research.md R4 |

---

## Known issues to expect (not regressions)

- `useEmployeePaychecks.test.ts` fails on this branch already.
- `CLAUDE.md` still describes `src/test/setup.ts` as missing. It exists; the note is stale and should be dropped.
- `LoanCard.tsx` renders `LoanSummary` string money through a helper that silently skips currency formatting. Pre-existing, out of scope here, worth its own task — the new shared `formatCurrency` in `src/lib/formatters.ts` is the fix when someone picks it up.
