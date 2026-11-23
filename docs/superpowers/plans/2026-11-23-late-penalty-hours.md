# Late Penalty in Hours (App) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let HR configure the API's new late penalty (hours per late day and monthly work hours), with a live example line, and show `late_penalty_total` as its own figure in the HR salary table and on the employee's salary screen.

**Architecture:** Extend the existing components. `LatenessConfig` gains 2 fields, and the panel gains 2 inputs plus an example line backed by a small pure helper in `lib/formatters.ts`. The summary types gain `late_penalty_total`, `useEmployeePaychecks` copies it, and the HR table, the expanded detail and the employee summary render it.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, Vitest + Testing Library, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-23-late-penalty-hours-design.md` (in this repo)

## Global Constraints

- Layering: components → hooks → services → `lib/api.ts`. No fetch in components; no new hooks or services.
- PUT `/employees/lateness-config` is a full replace: `LatenessConfig` and `emptyForm` must carry all 7 fields (`late_penalty_hours: 0`, `monthly_work_hours: 220` defaults).
- Money values from the API are `number | string`; render with `Number(x).toFixed(2)` like the neighboring cells/cards (the example line uses `formatCurrency`).
- Labels (pt-BR, exact): settings `Penalidade por atraso (h)`, `Horas mensais de trabalho`; table header `Penalidade Atraso`; detail line `Penalidade: R$ …`; employee card `Penalidade por Atraso`.
- Example line copy: `Ex.: salário R$ 2.200,00 ÷ {monthly} h × {hours} h = {formatCurrency(perDay)} por dia de atraso`, with sample salary 2200.
- Inputs: penalty `type=number min=0 max=999.99 step=0.01`; monthly hours `type=number min=1 step=1`.
- Test baseline: `npx vitest run` → `1 failed` (the pre-existing `useEmployeePaychecks` "should fetch active employees…" date-dependent test). Only new failures count.
- Verification for every task: `npm run typecheck` clean, `npx vitest run` → only the baseline failure.

## Review Focus

1. **Overview item without `late_penalty_total`** (API not yet deployed): the table cell should show `R$ 0.00`, not `R$ NaN`. Task 2 renders `Number(paycheck.late_penalty_total ?? 0)`.
2. **`monthly_work_hours` cleared or 0 in the form:** the example line must not show `Infinity`/`NaN`. Task 1's helper returns `null` and its test pins it.
3. **Saving after load from an old config response missing the new fields:** `setForm(config)` would drop them and the PUT would 422. Task 1 merges `{ ...emptyForm, ...config }`.
4. **Detail row width:** the expanded row must span the new column (`colSpan` 6 → 7) or the layout breaks. Task 2.
5. **Employee card grid:** with 6 cards in `lg:grid-cols-3`, the net salary card's `sm:col-span-2 lg:col-span-1` must still lay out cleanly. Builder checks visually in Task 2.

---

### Task 1: Settings (config type, example helper, panel)

**Files:**
- Modify: `src/types/latenessConfig.ts`
- Modify: `src/lib/formatters.ts`
- Test: `src/lib/formatters.test.ts`
- Modify: `src/components/LatenessConfigPanel.tsx`
- Modify: `specs/api/employees.md`

**Interfaces:**
- Produces: `LatenessConfig.late_penalty_hours: number`, `LatenessConfig.monthly_work_hours: number`.
- Produces: `latePenaltyPerDay(salary: number, monthlyWorkHours: number, penaltyHours: number): number | null` in `src/lib/formatters.ts`.

- [ ] **Step 1: Write the failing tests** in `src/lib/formatters.test.ts`

```ts
describe('latePenaltyPerDay', () => {
  it('returns salary / monthly hours × penalty hours', () => {
    expect(latePenaltyPerDay(2200, 220, 2)).toBe(20);
    expect(latePenaltyPerDay(1518, 220, 1.5)).toBeCloseTo(10.35, 10);
  });
  it('returns null when monthly hours is not a positive number', () => {
    expect(latePenaltyPerDay(2200, 0, 2)).toBeNull();
    expect(latePenaltyPerDay(2200, NaN, 2)).toBeNull();
  });
  it('returns null when penalty hours is not a finite number', () => {
    expect(latePenaltyPerDay(2200, 220, NaN)).toBeNull();
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/formatters.test.ts` — Expected: FAIL (`latePenaltyPerDay` is not exported).

- [ ] **Step 3: Implement `latePenaltyPerDay`** in `src/lib/formatters.ts` with a short doc comment saying it is illustrative only (the API computes the real, rounded totals).

- [ ] **Step 4: Run** `npx vitest run src/lib/formatters.test.ts` — Expected: PASS.

- [ ] **Step 5: Type + panel**
  - `LatenessConfig`: add both fields.
  - `LatenessConfigPanel`: `emptyForm` gains `late_penalty_hours: 0`, `monthly_work_hours: 220`; the effect becomes `setForm({ ...emptyForm, ...config })`; add a `grid grid-cols-1 sm:grid-cols-2 gap-4` row under the existing 3-input grid with the two inputs (labels/attrs from Global Constraints), and under it a `text-xs text-gray-500` paragraph with the example line. When the helper returns `null`, render the line up to `= —`.
  - Update the panel's subtitle to mention the penalty in hours (wording is the builder's call).

- [ ] **Step 6: Contract** — `cp ../gestur-api/specs/api/employees.md specs/api/employees.md` from the API's `feature/010-late-penalty-hours` branch (`git -C ../gestur-api show feature/010-late-penalty-hours:specs/api/employees.md > specs/api/employees.md`). The app's copy was identical to the API's `main` before, so this carries exactly PR #19's changes. Check `git diff --stat specs/api/employees.md` shows only that file.

- [ ] **Step 7: Verify** `npm run typecheck` (clean) and `npx vitest run` (only the baseline failure).

- [ ] **Step 8: Commit**

```bash
git add src/types/latenessConfig.ts src/lib/formatters.ts src/lib/formatters.test.ts src/components/LatenessConfigPanel.tsx specs/api/employees.md
git commit -m "add late penalty hours to lateness settings"
```

---

### Task 2: Salary views (types, paycheck hook, HR table + detail, employee card)

**Files:**
- Modify: `src/types/employee.ts` (`SalarySummaryResponse`, `SalarySummaryOverviewItem`, `EmployeePaycheck`)
- Modify: `src/hooks/useEmployeePaychecks.ts` (~line 43)
- Test: `src/hooks/useEmployeePaychecks.test.ts`
- Modify: `src/components/HR/SalaryTab.tsx` (header ~line 132)
- Modify: `src/components/HR/EmployeePaycheckRow.tsx`
- Modify: `src/components/HR/EmployeePaycheckDetail.tsx`
- Modify: `src/components/Journey/EmployeeSalarySummary.tsx`

**Interfaces:**
- Produces: `late_penalty_total: number | string` on `SalarySummaryResponse` and `SalarySummaryOverviewItem` (required), `late_penalty_total?: number | string` on `EmployeePaycheck`.
- Produces: `EmployeePaycheckDetail` prop `latePenaltyTotal: number | string`.

- [ ] **Step 1: Write the failing test** — add `late_penalty_total: 0` to the `overviewItem` fixture, and a new test:

```ts
it('should carry late_penalty_total from the overview into the paycheck', async () => {
  vi.mocked(employeeService.getAll).mockResolvedValue([employee({})]);
  vi.mocked(employeeService.getSalarySummaryOverview).mockResolvedValue(
    overviewResponse([overviewItem({ late_penalty_total: '20.00' })])
  );
  const { result } = renderHook(() => useEmployeePaychecks());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.paychecks[0].late_penalty_total).toBe('20.00');
});
```

- [ ] **Step 2: Run** `npx vitest run src/hooks/useEmployeePaychecks.test.ts` — Expected: the new test FAILS (`late_penalty_total` is `undefined`); vitest does not typecheck, so the fixture's extra field does not block the run.

- [ ] **Step 3: Types + hook** — add the fields from Interfaces; in `useEmployeePaychecks` copy `late_penalty_total: summary.late_penalty_total` next to `late_deduction_total`.

- [ ] **Step 4: Run** the same file — Expected: new test PASS; only the baseline test fails.

- [ ] **Step 5: Render**
  - `SalaryTab`: header `Penalidade Atraso` between `Desc. Atraso` and `Salário Líquido`, same classes.
  - `EmployeePaycheckRow`: matching `text-red-700` cell showing `R$ ${Number(paycheck.late_penalty_total ?? 0).toFixed(2)}` when `summaryLoaded`, else `—`; detail `colSpan={7}`; pass `latePenaltyTotal={paycheck.late_penalty_total ?? 0}`.
  - `EmployeePaycheckDetail`: accept `latePenaltyTotal`; under the `Desconto:` line add `Penalidade: R$ {Number(latePenaltyTotal).toFixed(2)}` with the same classes.
  - `EmployeeSalarySummary`: a red card copied from "Desconto por Atraso" with label `Penalidade por Atraso`, value `R$ {Number(summary.late_penalty_total ?? 0).toFixed(2)}`, a lucide icon of the builder's choice (e.g. `Hourglass`), placed before "Salário Líquido". Adjust the net salary card's col-span so 6 cards lay out cleanly in the `sm:grid-cols-2 lg:grid-cols-3` grid (with 6 cards, drop `sm:col-span-2 lg:col-span-1`).

- [ ] **Step 6: Verify** `npm run typecheck` (clean), `npm run lint` (no new errors in touched files), `npx vitest run` (only the baseline failure).

- [ ] **Step 7: Commit**

```bash
git add src/types/employee.ts src/hooks/useEmployeePaychecks.ts src/hooks/useEmployeePaychecks.test.ts src/components/HR/SalaryTab.tsx src/components/HR/EmployeePaycheckRow.tsx src/components/HR/EmployeePaycheckDetail.tsx src/components/Journey/EmployeeSalarySummary.tsx
git commit -m "show late penalty in hr salary table and employee summary"
```
