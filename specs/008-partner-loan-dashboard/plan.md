# Implementation Plan: Partner Loan Period Dashboard

**Branch**: `008-partner-loan-dashboard` | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-partner-loan-dashboard/spec.md`

## Summary

Add a second tab to the Bugueiros page — a read-only period dashboard over the whole partner loan book. The user picks a date range; the dashboard shows expected revenue split into returned capital and profit, how much has been received versus outstanding, and a per-partner breakdown of who owes what.

All of it comes from one new backend call, `GET /loans/period-summary?start_date&end_date`, already documented in `specs/api/loans.md`. There is no client-side aggregation of loans, no second request, and no new dependency: the whole feature is one service method, one hook, and a small set of presentational components following the existing `HR.tsx` + `HR/` tab pattern.

Access is gated to `isSuperAdmin`, matching the existing gate on the loans drawer in `src/components/Buggyman.tsx:222`. Confirmed by the user during planning; the backend itself places no role requirement on this endpoint.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), React 18.3

**Primary Dependencies**: Vite 5.4, Tailwind CSS 3.4, `lucide-react` 0.344 (icons). **No new dependencies** — the two composition bars are Tailwind `div`s, not a charting library, per Constitution V.

**Storage**: N/A — no client persistence. Tab and range state are component state, lost on page navigation (spec FR-004 only requires persistence while on the page).

**Testing**: Vitest 4.1 + Testing Library. Note: `src/test/setup.ts` **now exists** (`@testing-library/jest-dom`), so the "Known issue" in `CLAUDE.md` is stale and should be dropped. Baseline on this branch: 41 passing / 1 failing — `useEmployeePaychecks.test.ts` fails pre-existing, unrelated to this feature.

**Target Platform**: Browser (desktop + mobile web), Portuguese (pt-BR) UI.

**Project Type**: Single-page React frontend consuming a separate backend via `VITE_API_URL`.

**Performance Goals**: Figures readable within 2s of opening the tab and within 2s of a range change (spec SC-003, SC-004). One network request per applied range; no request fan-out per partner.

**Constraints**:
- Money arrives as **fixed two-decimal strings** (`"0.00"`), never numbers — see the Money Handling decision in [research.md](./research.md). This is the single highest-risk detail in the feature.
- Dates are `YYYY-MM-DD` and must be built from **local** calendar parts, not `toISOString()`, which shifts the day in UTC-3.
- Fully usable at 360px with no horizontal page scroll (spec SC-007).
- No server-side paging anywhere in this API — the partner list arrives whole.

**Scale/Scope**: Realistically tens of buggymen per period; a multi-year range could reach low hundreds of rows. One page, two tabs, ~6 new components, 1 hook, 1 service method.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against `.specify/memory/constitution.md` v1.1.0.

| Principle | Status | How this plan complies |
|---|---|---|
| **I. Layered Architecture (NON-NEGOTIABLE)** | ✅ PASS | `SummaryTab` and its children render only; all state orchestration and range logic live in `useLoanPeriodSummary`; the only network call is `loanService.getPeriodSummary`. No component calls a service directly. |
| **II. Service-Only Backend Access** | ✅ PASS | One new method on the existing `loanService`, calling `api.get`. No `fetch` outside `src/lib/api.ts`. Errors surface as the existing `ApiError`. |
| **III. Strict TypeScript** | ✅ PASS | New models `LoanPeriodSummary` / `LoanPeriodSummaryPartner` go in `types/loan.ts`, already re-exported by `types/index.ts`. No `any`; explicit params and return types. Money typed `string`, matching the existing `LoanSummary` precedent. |
| **IV. Component Focus & Size Discipline** | ✅ PASS — with one deliberate extraction | `Buggyman.tsx` is already 270 lines, well past the ~150 ceiling; bolting tabs onto it would make it worse. The existing partner list moves **verbatim** into `Buggyman/PartnersTab.tsx`, leaving `Buggyman.tsx` a ~60-line tab shell. Every new component stays under the ceiling. See the note below. |
| **V. Consistency Over Novelty** | ✅ PASS | Extends the existing Bugueiros screen rather than adding a page. Reuses the `HR.tsx` tab markup, the `Reports.tsx` date-range filter shape, the `SalaryTab.tsx` table/empty/error structure, and the existing `LoanDrawer` for drill-through. No new libraries, no inline styles. |
| **Workflow & Quality Gates** | ✅ PASS | `npm run lint` and `npm run typecheck` must pass. No `console.log` / `alert` / `debugger` in new code — errors render in the UI error state, consistent with `LoanDrawer.tsx`. |

**Note on the `PartnersTab` extraction**: this is a behavior-preserving move, not a refactor of unrelated code — it is caused directly by introducing tabs, so it does not conflict with Principle V's "keep changes scoped" rule. It mirrors `HR.tsx` + `HR/`, which is the established shape for a tabbed screen in this codebase. The move must be verbatim (same JSX, same handlers, same `partnerService` calls) so that spec SC-010 — no regression in search, filter, create, edit, delete — holds.

**Post-Phase 1 re-check**: ✅ still passing. The Phase 1 design introduced no new layer crossings, no new dependencies, and no component over the size ceiling. The one addition worth recording is `formatCurrency` in `src/lib/formatters.ts` — `lib/` is exactly where Constitution I places stable utilities, and it is needed because the existing per-component `formatCurrency` helpers are silently wrong for string money (see research.md).

## Project Structure

### Documentation (this feature)

```text
specs/008-partner-loan-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── loan-period-summary.md
├── checklists/
│   └── requirements.md  # from /speckit-specify
├── spec.md
└── tasks.md             # Phase 2 — NOT created by /speckit-plan
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Buggyman.tsx                    # MODIFIED → thin tab shell (~60 lines)
│   └── Buggyman/                       # NEW directory (mirrors components/HR/)
│       ├── PartnersTab.tsx             # MOVED verbatim from Buggyman.tsx
│       ├── SummaryTab.tsx              # NEW — dashboard orchestration
│       ├── PeriodRangeFilter.tsx       # NEW — presets + custom dates + validation
│       ├── PeriodTotalsCards.tsx       # NEW — headline figures
│       ├── PeriodSplitBars.tsx         # NEW — capital/profit + received/outstanding
│       └── PartnerBreakdownTable.tsx   # NEW — sortable/searchable per-partner list
├── hooks/
│   ├── useLoanPeriodSummary.ts         # NEW — range state, fetch, stale-guard
│   ├── useLoanPeriodSummary.test.ts    # NEW — mirrors useLoans.test.ts
│   └── usePartnerLoanDrawer.ts         # NEW — drill-through resolution + drawer state
├── services/
│   └── loanService.ts                  # MODIFIED → + getPeriodSummary
├── types/
│   └── loan.ts                         # MODIFIED → + period summary models
└── lib/
    └── formatters.ts                   # MODIFIED → + formatCurrency, date helpers
```

**Structure Decision**: The existing domain-slice pattern is followed exactly — `types/loan.ts` → `services/loanService.ts` → `hooks/useLoanPeriodSummary.ts` → components. The `components/Buggyman/` directory is new but is not a new pattern: it is the same shape as `components/HR/`, which already holds `SalaryTab.tsx`, `JourneyTab.tsx`, and `ScheduleTab.tsx` behind the `HR.tsx` shell. `Buggyman.tsx` and `Buggyman/` coexist the same way `HR.tsx` and `HR/` do.

## Phase 0 — Research

Complete. See [research.md](./research.md). Ten decisions recorded; the load-bearing ones:

1. **Money as string, never number** — the API returns `"1234.50"`. The existing `formatCurrency` helpers in `LoanCard.tsx`, `InstallmentList.tsx`, and `InstallmentPaymentsRow.tsx` call `.toLocaleString('pt-BR', { style: 'currency' })` directly on the value; `String.prototype.toLocaleString` **ignores the options argument**, so a string amount renders as raw `"1234.50"` instead of `R$ 1.234,50`. New code must coerce with `Number()` first. A shared `formatCurrency(value: string | number)` goes in `lib/formatters.ts`.
2. **No client-side aggregation** — every displayed figure is a field the endpoint returns. The contract already guarantees the reconciliations (capital + profit = revenue, received + outstanding = revenue, partner sums = totals), so the UI displays rather than computes. The only derived value is the collection percentage.
3. **Local date construction** — presets are built from `getFullYear()/getMonth()/getDate()`, not `toISOString()`, which would shift the boundary day in UTC-3.
4. **Auto-apply on valid range only** — no "Apply" button (matching `Reports.tsx`), but the fetch is skipped while `end < start`, so the `400` in the contract is never triggered (spec SC-008).
5. **Stale-response guard** — a monotonic request id in a ref; a resolving response updates state only if it is the newest. Satisfies spec SC-004 and the "rapid range changes" edge case.

## Phase 1 — Design & Contracts

Complete. Artifacts:

- **[data-model.md](./data-model.md)** — `LoanPeriodSummary`, `LoanPeriodSummaryPartner`, `PeriodRange`, plus the derived view-model values (collection percentage, split bar segments) and their zero-guards.
- **[contracts/loan-period-summary.md](./contracts/loan-period-summary.md)** — the endpoint as this feature consumes it, its guarantees, its error cases, and the verification still outstanding against the live backend.
- **[quickstart.md](./quickstart.md)** — how to run and validate the feature end to end, mapped to the spec's acceptance scenarios.

### Component responsibilities

| Component | Responsibility | Props in | Notes |
|---|---|---|---|
| `Buggyman.tsx` | Tab shell + `isSuperAdmin` gate on the summary tab | — | Holds `activeTab` + `summaryVisited`; lazy-mounts `SummaryTab` on first visit then keeps it mounted (`hidden` when inactive) so range/sort/search state survives tab switches per FR-004 |
| `PartnersTab.tsx` | Existing partner CRUD list | — | Verbatim move; owns its own state and `LoanDrawer` as today |
| `SummaryTab.tsx` | Wires `useLoanPeriodSummary` to the presentational pieces; owns drill-through drawer state | — | Must stay a composition root, no business logic |
| `PeriodRangeFilter.tsx` | Presets, custom start/end inputs, inline invalid-range message | `startDate`, `endDate`, `onChange`, `invalidReason` | Presets: mês atual, mês anterior, trimestre atual, ano atual, próximos 30 dias |
| `PeriodTotalsCards.tsx` | Headline figures with prominence hierarchy | `summary` | Revenue/received/outstanding prominent; capital, profit, counts secondary |
| `PeriodSplitBars.tsx` | The two stacked proportion bars + collection % | `summary` | Renders `—` when `expected_revenue` is `"0.00"` |
| `PartnerBreakdownTable.tsx` | Sort, name search, per-row progress, row activation | `partners`, `onSelectPartner` | Table ≥ `sm`, stacked cards below; rows are `<button>` for keyboard access |
| `usePartnerLoanDrawer.ts` | Drill-through state: buggyman list, row → `Partner` resolution, drawer open/close | — | Keeps `SummaryTab` under the size ceiling; exposes `drawerPartner`, `resolving`, `openFor`, `close` |

### UI copy (pinned)

Fixed here rather than improvised per component, because FR-014 requires labels that convey meaning without outside knowledge and the contract's due-date-vs-payment-date distinction is easy to misstate. All pt-BR (FR-030).

| Element | Label |
|---|---|
| `expected_revenue` | **Previsto a receber** — sublabel *"vencimentos no período"* |
| `expected_capital` | Retorno de capital |
| `expected_profit` | Lucro previsto |
| `received_amount` | Já recebido |
| `outstanding_amount` | Em aberto |
| `installments_count` | Parcelas |
| `partners_count` | Bugueiros |
| collection percentage | % recebido |
| applied range | "Vencimentos de 01/08/2026 a 31/08/2026" |
| preset buttons | Mês atual · Mês anterior · Trimestre atual · Ano atual · Próximos 30 dias · Personalizado |
| table columns | Bugueiro · Parcelas · Previsto · Recebido · Em aberto · Progresso |
| settled badge | Quitado |
| empty period | "Nenhuma parcela vence neste período." / "Tente ampliar o intervalo de datas." |
| error state | "Não foi possível carregar o resumo." / "Tentar novamente" |
| invalid range | "A data final não pode ser anterior à inicial." |

"Previsto a receber" plus the *vencimentos* sublabel is what satisfies FR-014 — it states that the figure is scheduled by due date without implying money moved during the period.

### Hook contract

```text
useLoanPeriodSummary() → {
  summary: LoanPeriodSummary | null
  startDate: string
  endDate: string
  setRange(start: string, end: string): void
  invalidRange: boolean          // end < start — blocks fetch, drives inline message
  loading: boolean               // first load for the current range
  refreshing: boolean            // a range change while data is already on screen
  error: string | null
  refetch(): void                // retry action in the error state
}
```

Defaults to the current calendar month on mount and fetches immediately (spec FR-006).

### Drill-through

`PartnerBreakdownTable` emits the clicked row. `usePartnerLoanDrawer` turns it into the `Partner` object the existing `LoanDrawer` requires: it loads the buggyman list once via `partnerService.getByType(PartnerType.BUGGYMAN)` and matches by `partner_id`, falling back to `partnerService.getById(partner_id)` when the partner is absent from that list.

**No partial `Partner` is ever constructed.** `src/types/partner.ts` requires `loans`, `pix_key`, `type`, `active`, and `created_at`; a hand-built object would need an `as` cast, which Constitution III forbids. Going through `getById` also yields the true `active`, so the drawer's Ativo/Inativo badge is correct for the inactive partners the contract deliberately includes. See research.md R10.

The dashboard renders without waiting on the list; only the drill-through depends on it.

## Complexity Tracking

> No Constitution violations. Table intentionally omitted.

## Risks

| Risk | Mitigation |
|---|---|
| `/loans/period-summary` not yet deployed on the target backend — the contract is documented but the change to `specs/api/loans.md` is still uncommitted | Verify against the live backend before implementing (see quickstart step 1). If absent, the feature is blocked at the service layer only; nothing else in the plan changes. |
| String money silently rendering unformatted, repeating the existing `LoanCard` bug | Single shared `formatCurrency` in `lib/formatters.ts` with a unit test covering the string input case. |
| The `PartnersTab` extraction regressing existing CRUD | Verbatim move, no signature or behavior change; validated against spec SC-010 in quickstart. |
| Cent-level mismatch when users compare the dashboard against a loan's own total | Documented as expected in the contract; no UI asserts cross-view equality (spec assumption). |
