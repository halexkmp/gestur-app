# Internal Interface Contracts

Module boundaries introduced by this feature. Signatures are the contract; bodies are implementation and belong in `tasks.md`.

Layer flow (Principle I): `UpcomingTab` → `useUpcomingInstallments` → `loanService` → `api`.

---

## Service — `src/services/loanService.ts`

Added alongside the existing `getPeriodSummary`:

```ts
getUpcomingInstallments: (
  params: UpcomingInstallmentsParams
): Promise<UpcomingInstallment[]> =>
  api.get<UpcomingInstallment[]>('/loans/upcoming-installments', { params }),
```

Returns the array as received. No sorting, filtering, or reshaping — the server's order is the contract (FR-007).

---

## Hook — `src/hooks/useUpcomingInstallments.ts`

```ts
export const useUpcomingInstallments: () => {
  // data
  installments: UpcomingInstallment[] | null;  // null = never loaded
  rowCount: number;
  totalOutstanding: number;                    // reais; summed in cents (R-002)
  overdueCount: number;

  // filters
  startDate: string;
  endDate: string;
  preset: PeriodPresetId;
  includeOverdue: boolean;
  setRange: (startDate: string, endDate: string) => void;
  applyPreset: (preset: PeriodPresetId) => void;
  setIncludeOverdue: (include: boolean) => void;

  // status
  invalidRange: boolean;
  isEmpty: boolean;
  loading: boolean;      // first load, nothing on screen yet
  refreshing: boolean;   // refetch with data already on screen
  error: string | null;
  refetch: () => Promise<void>;
};
```

Takes no arguments — like `useLoanPeriodSummary`, it owns its own filter state.

**Behavioral contract** (each clause is directly testable):

1. Initializes to `periodPresetRange('next-30-days')` with `preset: 'next-30-days'`, `includeOverdue: false` (R-004).
2. Fetches on mount and on any change to `startDate`, `endDate`, or `includeOverdue`.
3. Never fetches while `endDate < startDate`; previously loaded rows stay on screen (FR-019).
4. Sends `include_overdue` explicitly in both states (R-001).
5. `setRange` sets `preset` to `'custom'`; `applyPreset` sets both dates from the preset. Neither touches `includeOverdue`, and `setIncludeOverdue` never touches the dates (FR-005/FR-022 independence).
6. Discards responses from superseded requests via a monotonic request-id ref — a slow earlier range must never overwrite a newer one.
7. Splits `loading` (nothing on screen) from `refreshing` (data present), using a `hasDataRef`, so a refetch dims rather than blanks the table.
8. `installments` is `null` until the first success; `isEmpty` is true only when loaded *and* empty.
9. `error` holds `err.message` when `err instanceof Error`, else `'Não foi possível carregar as parcelas.'`.
10. `totalOutstanding` sums `remaining_amount` in integer cents (R-002); `overdueCount` counts `is_overdue === true`.

Clauses 3, 6, 7 and 9 are inherited verbatim from `useLoanPeriodSummary` — copy that hook's structure rather than re-deriving it.

---

## Modified — `src/hooks/usePartnerLoanDrawer.ts`

```diff
- const openFor = useCallback(async (row: LoanPeriodSummaryPartner) => {
+ const openFor = useCallback(async (row: { partner_id: string }) => {
```

Widening only. `LoanPeriodSummaryPartner` stays structurally assignable, so `SummaryTab`'s call site is untouched and behavior is identical (R-007). The now-unused `LoanPeriodSummaryPartner` import is dropped. Everything else — the preloaded partner list, the `GET /partners/{id}` fallback, `resolving`, `close` — is unchanged.

---

## New formatter — `src/lib/formatters.ts`

```ts
/** Whole days a YYYY-MM-DD due date is in the past; 0 when due today or later. */
export const daysOverdue: (dueDate: string) => number;
```

Anchors both dates at local noon before diffing, matching `formatDateBR` and keeping whole-day arithmetic correct across DST (R-003). Returns `0` — never negative — for today or any future date. Additive; nothing existing changes.

---

## Components — `src/components/Buggyman/`

All are presentational: they render props and raise callbacks. No fetching, no business logic (Principles I and IV).

### `UpcomingTab.tsx` — orchestrator, no props

Calls `useUpcomingInstallments` and `usePartnerLoanDrawer`, composes the children below, renders `LoanDrawer`. Mirrors `SummaryTab.tsx` closely enough that the two should be diffable side by side.

### `UpcomingFiltersBar.tsx`

```ts
interface UpcomingFiltersBarProps {
  includeOverdue: boolean;
  overdueCount: number;
  startDate: string;
  endDate: string;
  refreshing: boolean;
  disabled: boolean;              // invalidRange || loading || refreshing
  onIncludeOverdueChange: (include: boolean) => void;
  onRefresh: () => void;
}
```

The overdue switch (FR-017's second filter), the "Vencimentos de … a …" caption, and the refresh button — the same row `SummaryTab` renders inline. The switch is a labelled control, not an icon-only toggle, and states what it does when on.

`PeriodRangeFilter` is rendered by `UpcomingTab` directly, unchanged and unwrapped.

### `UpcomingSummaryBar.tsx`

```ts
interface UpcomingSummaryBarProps {
  rowCount: number;
  totalOutstanding: number;
}
```

Satisfies FR-012. The total is labelled as belonging to the listed rows; it must not be labelled, positioned, or captioned so as to invite comparison with the Resumo tab (FR-013, R-005).

`overdueCount` deliberately does **not** appear here — it belongs to `UpcomingFiltersBar`, beside the control that produces it, so the user sees the size of what the switch pulls in before flipping it. Rendering it in both components would stack the same number twice in adjacent rows.

### `UpcomingInstallmentsTable.tsx` — `sm` and up

```ts
interface UpcomingInstallmentsTableProps {
  installments: UpcomingInstallment[];
  onSelectPartner: (row: { partner_id: string }) => void;
}
```

Columns, in order: Vencimento · Bugueiro · Parcela · Valor · Pago · Em aberto · Situação.

- Rows render in received order — no client-side sort (FR-007). Unlike `PartnerBreakdownTable`, this table has **no** sortable headers and no search box; FR-017 fixes the controls at two filters.
- Wrapper: `hidden sm:block overflow-x-auto`, with `sticky top-0` on the header row (SC-008, FR-016).
- Key: `installment_id`.
- Partner name is a button invoking `onSelectPartner` (FR-025), styled like `PartnerBreakdownTable`'s.
- Overdue rows carry a persistent visual marker plus `daysOverdue` — not colour alone (FR-010, SC-004).
- `PARTIALLY_PAID` rows are distinguishable from `PENDING` (FR-009).
- Money via `formatCurrency`, dates via `formatDateBR`.

### `UpcomingInstallmentsCards.tsx` — below `sm`

```ts
interface UpcomingInstallmentsCardsProps {
  installments: UpcomingInstallment[];
  onSelectPartner: (row: { partner_id: string }) => void;
}
```

`sm:hidden` stacked list carrying the same fields and the same overdue/partial markers, following `PartnerBreakdownCards`.

### `UpcomingTabStates.tsx`

```ts
interface UpcomingTabStatesProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  includeOverdue: boolean;
  onRetry: () => void;
}
```

Error (message + "Tentar novamente"), loading (skeleton shaped like *this* table, so nothing shifts when data lands), and empty — three visually distinct states (FR-023, FR-024).

The empty copy is aware of `includeOverdue`: with the switch off it can suggest turning it on; with it on, "nothing is owed in this period" is the complete answer.

**Why not reuse `SummaryTabStates`**: its skeleton mirrors the summary's cards-and-bars layout and its empty copy is summary-specific, so reuse would need a shape prop plus copy props — more coupling than the ~20 duplicated lines of error-block markup it would save. Extracting a shared state component would also mean editing working 008 code for no functional gain, which Principle V discourages. Accepted duplication, recorded here deliberately.

---

## Modified — `src/components/Buggyman.tsx`

```diff
- type BuggymanTab = 'partners' | 'summary';
+ type BuggymanTab = 'partners' | 'summary' | 'upcoming';
```

The `summaryVisited` boolean becomes a `Set<BuggymanTab>` of visited tabs (R-006), preserving the existing mount-once-then-hide behavior — which is what makes FR-004 work — for both gated tabs. New tab: label "A receber", icon `CalendarClock` (`lucide-react`), placed after "Resumo", gated on `isSuperAdmin` exactly as "Resumo" is (FR-002).

The `partners` and `summary` tabs must render identically to today (FR-005).
