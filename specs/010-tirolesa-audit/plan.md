# Tirolesa Audit Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken Auditoria page with an ADMIN-only daily tirolesa audit screen and its setup tab.

**Architecture:** The standard slice: `types/tirolesa.ts`, `services/tirolesaService.ts`, two hooks, and components under `components/Tirolesa/`. The page owns both hooks and passes them to its tabs. Verdict rules are a pure function in `lib/`, so they can be tested without rendering.

**Tech Stack:** React 18, TypeScript, Tailwind, lucide-react, Vitest with Testing Library.

**Spec:** `specs/010-tirolesa-audit/design.md`

## Global Constraints

- Layering: `components/` → `hooks/` → `services/` → `lib/api.ts`. Components never call services.
- UI text is Brazilian Portuguese, and the exact strings in the spec are used as written.
- No new dependencies. No `console.log`, `debugger` or `alert`.
- Do not change `Reports.tsx`, sales, or the `firebase` package.
- Test baseline: `src/hooks/useEmployeePaychecks.test.ts` already fails. Only new failures count.
- Commit messages are short and lower-case, and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never stage `.superpowers/`. Use the paths given in each commit step.
- All work stays on branch `feature/010-tirolesa-audit`.

## Review Focus

1. The admin clicks through days quickly: an older response never replaces the newer day. Task 3.
2. Saving a justification fails: the error reaches the modal and it stays open. Task 3.
3. A whitespace-only reason: blocked here, because the API currently accepts it. Task 2.
4. A reload fails after a good load: the error shows, never the previous day's verdict. Task 3.
5. The page stays open past midnight: "today" is worked out on each render, not once. Task 3.

---

### Task 1: Contract, types and service

**Files:**
- Copy from `../gestur-api/specs/api/`: `tirolesa.md`, `shared.md`, `users.md` into `specs/api/`
- Create: `src/types/tirolesa.ts`, `src/services/tirolesaService.ts`
- Modify: `src/types/index.ts`, `CLAUDE.md`

**Interfaces:**
- Produces types, mirroring `specs/api/tirolesa.md` field for field: `TirolesaAuditStatus`, `TirolesaJustificationType`, `TirolesaJustification`, `TirolesaAuditDay`, `TirolesaDevice`, `TirolesaCreatedDevice` (with `api_key`), `TirolesaProduct`, `CreateJustificationRequest` (`audit_date`, `quantity`, `type`, `reason`)
- Produces `tirolesaService`:
  - `getAuditDay(date: string): Promise<TirolesaAuditDay>`: calls `/tirolesa/audit` with `date_from` and `date_to` both `date`, returns row 0, throws `Error('Auditoria não encontrada para este dia')` if the array is empty
  - `createJustification(payload: CreateJustificationRequest)`, `deleteJustification(id: string)`
  - `getDevices()`, `createDevice(name: string)`, `updateDevice(id: string, payload: { name?: string; active?: boolean })`
  - `getProducts()`, `linkProduct(productId: string, unitsPerDescent: number)`, `unlinkProduct(id: string)`

- [ ] **Step 1: Copy the three contract files**

Run `diff` first on `shared.md` and `users.md`. If a file differs beyond the tirolesa changes, add only the tirolesa changes by hand.

- [ ] **Step 2: Add the types and service, following `latenessConfigService.ts`**

- [ ] **Step 3: Update `CLAUDE.md`**

Add `tirolesa` to the `specs/api/*.md` list, add `Tirolesa` in place of `Audit` in the page list, and remove the `Audit.tsx` mention from the Auth line.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add specs/api src/types src/services/tirolesaService.ts CLAUDE.md
git commit -m "add tirolesa contract, types and service"
```

### Task 2: Verdict rules

The spec does not list this file. It is a pure function so the verdict table, the screen's most important logic, can be tested directly.

**Files:**
- Create: `src/lib/tirolesaVerdict.ts`, `src/lib/tirolesaVerdict.test.ts`
- Modify: `src/lib/formatters.ts`, `src/lib/formatters.test.ts`

**Interfaces:**
- Consumes: `TirolesaAuditDay`
- Produces:

```ts
export type VerdictKind = 'setup' | 'in-progress' | 'unverifiable' | 'unexplained'
  | 'sold-above' | 'no-activity' | 'clock-suspect' | 'balanced';
export type VerdictTone = 'grey' | 'blue' | 'amber' | 'red' | 'green';
export interface AuditVerdict { kind: VerdictKind; tone: VerdictTone; title: string; detail?: string }

export const getAuditVerdict: (
  day: TirolesaAuditDay | null,
  options: { isToday: boolean; setupPending: boolean },
) => AuditVerdict | null;
export const getDeviceWarnings: (day: TirolesaAuditDay, isToday: boolean, verdictKind: VerdictKind) => string[];
export const canSubmitJustification: (quantity: number, reason: string) => boolean;
```

In `formatters.ts`: `shiftISODate(date: string, days: number): string`, which must not shift across a timezone or month boundary.

- [ ] **Step 1: Write the failing tests**

Use a `day(overrides)` builder with every field. Assert `kind`, `tone` and exact text:

```ts
it('setup wins over any status', ...)              // setupPending, status UNEXPLAINED → 'setup', grey, 'Configuração pendente'
it('setup applies with no day loaded', ...)        // day null, setupPending → 'setup'
it('returns null with no day and setup done', ...)
it('today is in progress before any result', ...)  // isToday, status UNEXPLAINED → 'in-progress', blue, 'Dia em andamento'
it('no contact and no rides cannot be verified', ...) // device_hours 0, detected 0, sold 3 → 'unverifiable', amber, 'Não foi possível conferir'
it('unexplained shows count and value', ...)       // unexplained 2, value 100 → red, '2 descidas sem explicação', 'Valor estimado: R$ 100,00'
it('uses the singular for one descent', ...)       // unexplained 1 → '1 descida sem explicação'
it('sold above detected', ...)                     // sold_above_detected 2 → amber, 'Vendas acima do detectado', '2 descidas: verifique o sensor ou vendas sem descida'
it('no activity', ...)                             // device_hours 5, all 0 → grey, 'Sem movimento neste dia'
it('clock suspect stops a green result', ...)      // BALANCED, clock_suspect_trips 2 → amber, 'Confira os horários', '2 descidas com horário suspeito entraram neste dia'
it('balanced', ...)                                // → green, 'Dia conferido'
```

`getDeviceWarnings`:

```ts
it('warns when the device was not seen', ...)      // device_hours 0, kind 'unexplained' → ['Dispositivo não visto neste dia']
it('no repeat when the verdict says it', ...)      // kind 'unverifiable' → []
it('no device warning on today', ...)              // isToday, device_hours 0 → []
it('warns about suspect clocks', ...)              // clock_suspect_trips 2, kind 'sold-above' → ['2 descidas com horário suspeito']
it('no repeat for clock-suspect verdict', ...)     // kind 'clock-suspect' → []
```

`canSubmitJustification`: `(1,'x')` true; `(0,'x')`, `(1.5,'x')`, `(1,'')`, `(1,'   ')` false.

`shiftISODate`: `('2026-11-01',-1)` is `'2026-10-31'`; `('2026-12-31',1)` is `'2027-01-01'`.

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/lib/tirolesaVerdict.test.ts src/lib/formatters.test.ts`
Expected: FAIL, functions not defined.

- [ ] **Step 3: Implement, in the spec's row order**

The "no device warning on today" case prevents a false alarm before the device's first contact of the day. Use `formatCurrency` for money.

- [ ] **Step 4: Run them and confirm they pass**

Run the same command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "add tirolesa verdict rules"
```

### Task 3: Audit hook

**Files:**
- Create: `src/hooks/useTirolesaAudit.ts`, `src/hooks/useTirolesaAudit.test.ts`

**Interfaces:**
- Consumes: `tirolesaService`, `toISODateLocal`, `shiftISODate`
- Produces:

```ts
export const useTirolesaAudit: () => {
  selectedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  day: TirolesaAuditDay | null;
  loading: boolean;
  error: string | null;
  goToPreviousDay: () => void;
  goToNextDay: () => void;   // does nothing on today
  goToYesterday: () => void;
  reload: () => Promise<void>;
  addJustification: (quantity: number, type: TirolesaJustificationType, reason: string) => Promise<void>;
  removeJustification: (id: string) => Promise<void>;
};
```

- [ ] **Step 1: Write the failing tests**

Mock the service as `useUpcomingInstallments.test.ts` does. Derive dates at runtime with `toISODateLocal`.

```ts
it('opens on yesterday and fetches it', ...)
it('moves back a day', ...)
it('never moves past today', ...)                  // next from today: no further fetch for tomorrow
it('ignores an older response', ...)               // first fetch resolves after the second; day stays the second
it('clears the day on a failed load', ...)         // good load, reload rejects → day null, error set
it('reloads after adding a justification', ...)    // payload uses selectedDate and a trimmed reason
it('rethrows a failed save', ...)                  // addJustification rejects; error reaches the caller
it('reloads after removing a justification', ...)
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/hooks/useTirolesaAudit.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

Use the `requestIdRef` pattern from `useLoanPeriodSummary`. Work out today with `toISODateLocal(new Date())` on each render, not in state. Do not catch inside `addJustification` or `removeJustification`, so the modal can show the error.

- [ ] **Step 4: Run them and confirm they pass**

Run the same command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTirolesaAudit.ts src/hooks/useTirolesaAudit.test.ts
git commit -m "add tirolesa audit hook"
```

### Task 4: Setup hook and Configuração tab

**Files:**
- Create: `src/hooks/useTirolesaSetup.ts`, `src/components/Tirolesa/SetupTab.tsx`, `src/components/Tirolesa/DeviceKeyNotice.tsx`

**Interfaces:**
- Consumes: `tirolesaService`, `productService.getAll()`
- Produces:

```ts
export const useTirolesaSetup: () => {
  devices: TirolesaDevice[];
  links: TirolesaProduct[];
  products: Product[];         // active products not yet linked
  loading: boolean;
  loaded: boolean;             // true once the first load succeeded
  error: string | null;
  setupPending: boolean;       // loaded and (no devices, or no links)
  hasActiveDevice: boolean;
  createDevice: (name: string) => Promise<TirolesaCreatedDevice>;
  setDeviceActive: (id: string, active: boolean) => Promise<void>;
  linkProduct: (productId: string, unitsPerDescent: number) => Promise<void>;
  unlinkProduct: (id: string) => Promise<void>;
};
```

`SetupTab` props: `{ setup: ReturnType<typeof useTirolesaSetup> }`.

- [ ] **Step 1: Implement the hook**

Each action reloads the lists and rethrows on failure.

- [ ] **Step 2: Implement `DeviceKeyNotice`**

Props `{ apiKey: string; onDismiss: () => void }`. Text "Esta chave não será mostrada novamente". The key is selectable text as well as a copy button, because the clipboard API can fail. Never write the key to storage.

- [ ] **Step 3: Implement `SetupTab`**

Follow the spec's Configuração section, with its confirmations and hint text. Status comes from `active` and `offline`: Inativo, Offline or Online.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTirolesaSetup.ts src/components/Tirolesa
git commit -m "add tirolesa setup tab"
```

### Task 5: Auditoria tab

**Files:**
- Create: `src/components/Tirolesa/AuditTab.tsx`, `src/components/Tirolesa/AuditVerdict.tsx`, `src/components/Tirolesa/JustifyRidesModal.tsx`

**Interfaces:**
- Consumes: `useTirolesaAudit`, `useTirolesaSetup`, `getAuditVerdict`, `getDeviceWarnings`, `canSubmitJustification`
- Produces: `AuditTab` props `{ audit: ReturnType<typeof useTirolesaAudit>; setup: ReturnType<typeof useTirolesaSetup>; onOpenSetup: () => void }`

- [ ] **Step 1: Implement `AuditVerdict`**

Props `{ verdict: AuditVerdict; onOpenSetup: () => void }`. Tones map to Tailwind colours. A link to Configuração shows for `kind === 'setup'`.

- [ ] **Step 2: Implement `JustifyRidesModal`**

Props `{ date: string; onSave: (quantity: number, type: TirolesaJustificationType, reason: string) => Promise<void>; onClose: () => void }`. Model it on `HR/JustifyAbsenceModal.tsx`. Saving is disabled until `canSubmitJustification` passes. Types show as Teste, Cortesia, Outro. On failure it stays open and shows the error.

- [ ] **Step 3: Implement `AuditTab`**

Layout from the spec, top to bottom, with `setup.loaded` required before a verdict is drawn. When `verdict.kind === 'setup'`, hide the cards, panel and footer. Show "Nenhum dispositivo ativo" above the date selector when `setup.loaded && setup.devices.length > 0 && !setup.hasActiveDevice`. A failed audit or setup load shows the error with "Tentar novamente". The next arrow is disabled when `isToday`. The "Abaixo do preço" card is amber above 0.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Tirolesa
git commit -m "add tirolesa audit tab"
```

### Task 6: Page, and replacing Auditoria

**Files:**
- Create: `src/components/Tirolesa.tsx`
- Modify: `src/App.tsx`, `src/components/Layout.tsx`, `src/types/index.ts`
- Delete: `src/components/Audit.tsx`, `src/types/audit.ts`

- [ ] **Step 1: Implement `Tirolesa.tsx`**

Title "Auditoria Tirolesa", subtitle "Auditoria diária das descidas". Tabs Auditoria and Configuração, styled like `Buggyman.tsx` and kept mounted. The page calls both hooks once and passes them down. Opening the Auditoria tab calls `audit.reload()`, so a newly linked product takes effect. Render nothing if `!isSuperAdmin`.

- [ ] **Step 2: Replace the old page**

In `App.tsx`, `case 'audit'` renders `<Tirolesa />`. In `Layout.tsx`, add `if (item.id === 'audit') return isSuperAdmin;`. Delete the two old files and the `./audit` export.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run && npm run build`
Expected: no new errors. Tests show only the known `useEmployeePaychecks` failure.

- [ ] **Step 4: Check it in the browser**

Run the app against a local `gestur-api` on the PR branch, using a scratch database, and go through the screen as ADMIN:
- Setup: no device shows "Configuração pendente". Create a device, see the key once, and link a product.
- Each verdict: red, amber, green, grey, blue for today, and "Não foi possível conferir".
- Justify a ride and watch the verdict change. Remove it after confirming.
- Deactivating the only device keeps past results and shows "Nenhum dispositivo ativo".
- A MANAGER login no longer sees the menu item.

- [ ] **Step 5: Commit**

```bash
git add src CLAUDE.md
git commit -m "replace auditoria page with tirolesa audit"
```
