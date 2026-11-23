# Late Penalty in Hours (App) — Design

**Date:** 2026-11-23
**Size:** small change
**Backend:** gestur-api PR #19 (`feature/010-late-penalty-hours`), deployed together with this change.

## Intent

The API now adds a second lateness penalty: every late day (arrival after the expected entrance
time plus the tolerance) costs the employee a flat number of **hours** of pay, with the hourly
rate equal to `salary / monthly_work_hours`. It adds to the existing per-interval R$ deduction and
does not replace it. The app has to let HR configure it and show it on its own, both to HR and to
the employee, so a salary discount is never something the employee can't explain.

## Goals

- HR sets `late_penalty_hours` and `monthly_work_hours` in the lateness settings.
- A live example line under the hours fields shows what one late day costs.
- The HR salary table and the employee's salary screen show `late_penalty_total` as its own
  figure, next to the existing deduction (option 1, separate, as the user chose).

## Non-goals

- No penalty math in the browser beyond the illustrative example line; totals come from the API.
- No new screens, hooks, or services.
- No changes to the API contract beyond copying PR #19's `specs/api/employees.md` changes.

## Constraints

- PUT is a full replace: `LatenessConfig` must carry all 7 fields, and the form's empty defaults
  must include them (`late_penalty_hours: 0`, `monthly_work_hours: 220`). Otherwise saving fails.
- API validation: `0 <= late_penalty_hours < 1000`, `monthly_work_hours > 0` (400 otherwise; the
  existing hook already shows API errors).
- Money values arrive as `number | string` (Decimal), same as `late_deduction_total`.
- The same "Aplicar desconto por atraso" checkbox (`enabled`) gates both penalties.

## Approaches considered

1. **Extend the existing components (chosen):** type + form, table column + row cell + detail,
   one extra employee card. Follows every existing pattern; the service and hook need no change.
2. **Separate settings panel for the penalty:** rejected, because it splits one full-replace PUT
   across two forms.
3. **Compute the penalty client-side:** rejected, because the API already returns the rounded
   total and a client copy could drift from it.

## Changes and screens

**`types/latenessConfig.ts`:** add `late_penalty_hours: number` and `monthly_work_hours: number`.

**`LatenessConfigPanel.tsx`:** `emptyForm` gains `0` and `220`. A second row of inputs sits
below the existing three:

```
Configuração de Atrasos
[x] Aplicar desconto por atraso
Horário de entrada esperado  [08:00:00]
Tolerância (min) [10]  Intervalo do desconto (min) [60]  Valor do desconto (R$) [5.00]
Penalidade por atraso (h) [2]          Horas mensais de trabalho [220]
Ex.: salário R$ 2.200,00 ÷ 220 h × 2 h = R$ 20,00 por dia de atraso
[Salvar configuração]
```

- Penalty input: `type=number`, `min=0`, `max=999.99`, `step=0.01`. Monthly hours input:
  `min=1`, `step=1`.
- The example line is live: a fixed sample salary of R$ 2.200,00 with the form's current values
  plugged in, formatted with `formatCurrency`. When `monthly_work_hours <= 0` it shows the line
  without a result (nothing computed) instead of dividing by zero. This is the builder's call on
  wording.

**HR salary table (`HR/SalaryTab.tsx`, `HR/EmployeePaycheckRow.tsx`):** a new column
"Penalidade Atraso" between "Desc. Atraso" and "Salário Líquido"; detail row `colSpan` 6 → 7.

```
Funcionário | Salário Bruto | Desc. Adiantamentos | Desc. Atraso | Penalidade Atraso | Salário Líquido | Detalhes
Ana         | R$ 2200.00    | R$ 100.00           | R$ 5.00      | R$ 20.00          | R$ 2075.00      |   v
```

**`HR/EmployeePaycheckDetail.tsx`:** new prop `latePenaltyTotal`; the lateness block shows a
second line, `Penalidade: R$ 20.00`, under `Desconto: R$ 5.00`.

**`Journey/EmployeeSalarySummary.tsx`:** a new red card, "Penalidade por Atraso", with
`R$ {late_penalty_total}`, placed after "Desconto por Atraso" and before "Salário Líquido" (the
grid gets one more card; the builder adjusts the col-span so it still lays out cleanly).

**`types/employee.ts`:** add `late_penalty_total` to the three summary/paycheck interfaces,
matching how `late_deduction_total` is typed in each (required or optional).

**`specs/api/employees.md`:** copy the PR #19 changes (config fields, 400 rules, penalty
formula, `late_penalty_total`, `net_salary` formula).

## Left to the builder

- Exact Tailwind classes, the card icon (lucide), and the grid col-span adjustment.
- Whether existing tests that build `LatenessConfig` or paycheck fixtures need the new fields
  (`src/hooks/useEmployeePaychecks.test.ts` already has 1 known pre-existing failure).
