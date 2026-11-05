# Tirolesa Audit Screen: Design

Date: 2026-11-05
Status: approved by owner, 2026-11-05
API design: `gestur-api/specs/009-tirolesa-audit/design.md`
API contract: `gestur-api/specs/api/tirolesa.md`, PR #17

## Intent

The API compares tirolesa descents detected by a device with descents sold, so a ride
run without a sale shows up. This screen is where the admin does that review each day:
see yesterday's result, explain test and courtesy rides, and notice anything wrong. It
also holds the setup the audit depends on.

## Goals

- Show one day's verdict at a glance, opening on yesterday.
- Let the admin justify rides and remove a justification.
- Make warning signs visible: below-price sales and device problems.
- Let the admin register devices and link products from the same screen.
- Replace the broken "Auditoria" page.

## Non-goals

- A multi-day table, charts or exports.
- Showing deleted justifications. The API has no endpoint for them.
- Showing individual trips. The API does not list them.
- Editing a justification. Remove it and create a new one.
- Alerts or notifications.
- Changes to the sales screen, such as adding tandem products. Products are created
  on the existing Produtos page.

## Anti-goals

The feature fails, even if it technically works, if:

- A day reads as checked when the audit could not really check it, for example with
  no device or no linked products configured.
- The admin has to work out what the numbers mean before knowing whether to act.
- A device key is lost because nothing made clear it is shown only once.

## Constraints

- No client-side router: `App.tsx` switches pages by a `currentPage` string.
- Strict layering: `components/` → `hooks/` → `services/` → `lib/api.ts`. Types live in
  `types/<domain>.ts` and are re-exported from `types/index.ts`.
- `specs/api/*.md` is this project's source of truth, so `tirolesa.md` and the changed
  `shared.md` and `users.md` must be copied in from `gestur-api`.
- UI text is in Brazilian Portuguese. Tailwind and `lucide-react`, with no new
  dependencies.
- The screen needs API PR #17 merged and deployed before it can work.

## Approaches

### Layout (chosen by the owner)

- **A. One day at a time. Chosen.** Opens on yesterday with a clear verdict. It suits a
  daily review, where the first thing seen is what needs action.
- B. Table of recent days. Rejected: denser, and the answer takes longer to read.

### Old "Auditoria" page (chosen by the owner)

- **B. Replace it with this screen. Chosen.** Removes the broken page.
- A. Add a new menu item and leave Auditoria alone. Rejected by the owner.

### How it is built (one sensible way)

The app's standard slice with a tabbed page, like Bugueiros. Extending `Reports.tsx`
was ruled out: it is already 690 lines and used by every role. A separate app or a
router goes against the project.

## Design

### Decided by the owner

- Daily review, for ADMIN only.
- Layout A, one day at a time, based on the mockup.
- This screen replaces the Auditoria page and its old log feature is removed.
- A day with no device contact and no detected rides reads "Não foi possível conferir".

### Calls made by the designer

The owner has not specifically confirmed these.

1. **Menu:** keep the `audit` page id and the "Auditoria" label. The page title is
   "Auditoria Tirolesa", with the subtitle "Auditoria diária das descidas".
2. **Access:** `Layout.tsx` gets `if (item.id === 'audit') return isSuperAdmin;`, so
   MANAGER no longer sees this menu item, although the API allows MANAGER.
3. **Default day:** yesterday, using `toISODateLocal`. A "Ontem" button returns to it.
4. **Today:** can be selected, with its own neutral verdict. The forward arrow is
   disabled on today, so future dates cannot be reached.
5. **Removing the old page:** delete `src/components/Audit.tsx` and `src/types/audit.ts`,
   and its export from `types/index.ts`. The `firebase` package stays, as removing it
   is unrelated cleanup. Update the `Audit.tsx` mention in `CLAUDE.md`.
6. **Tests:** a test file for the hook, as its neighbours have. The project does not
   require them, but day navigation and stale responses are easy to break.

### Files

```text
src/types/tirolesa.ts              # also export from types/index.ts
src/services/tirolesaService.ts
src/hooks/useTirolesaAudit.ts      # selected day, audit row, justification actions
src/hooks/useTirolesaAudit.test.ts
src/hooks/useTirolesaSetup.ts      # devices and linked products
src/components/Tirolesa.tsx        # page, title, tabs
src/components/Tirolesa/AuditTab.tsx
src/components/Tirolesa/AuditVerdict.tsx
src/components/Tirolesa/JustifyRidesModal.tsx
src/components/Tirolesa/SetupTab.tsx
src/components/Tirolesa/DeviceKeyNotice.tsx
```

`App.tsx` renders `<Tirolesa />` for `audit`. Types mirror the contract exactly.

### Auditoria tab

Calls `GET /tirolesa/audit` with `date_from` and `date_to` both set to the selected
day, and reads the single row. It also loads devices and linked products, to decide
the setup state below. A new response must not be overwritten by an older one when the
admin moves quickly between days: use the `requestIdRef` pattern from
`useLoanPeriodSummary`.

From top to bottom:

1. Date selector: previous arrow, weekday and date, next arrow, "Ontem" button.
2. Device warning, when `sensor_warning` is true:
   - `device_hours` is 0: "Dispositivo não visto neste dia"
   - `clock_suspect_trips` above 0: "N descidas com horário suspeito"
3. Verdict banner, using the first match below.
4. Four cards: Detectadas, Vendidas, Justificadas, Abaixo do preço. The last card turns
   amber when above 0, with the hint "Vendas abaixo do preço padrão".
5. Justificativas panel: "+ Justificar" button, and one line per justification with
   quantity, type, reason, author name, time, and a remove button.
6. Footer: "Vendas: R$ X · Dispositivo online: N h".

Verdict, first match wins:

| Condition | Colour | Text |
|---|---|---|
| No device registered at all, or no linked product | Grey | "Configuração pendente", with a link to Configuração |
| Selected day is today | Blue | "Dia em andamento", "O resultado final sai quando o dia terminar" |
| `device_hours` is 0 and detected is 0 | Amber | "Não foi possível conferir", "O dispositivo não foi visto neste dia" |
| `status = UNEXPLAINED` | Red | "N descidas sem explicação", "Valor estimado: R$ X" |
| `status = SOLD_ABOVE_DETECTED` | Amber | "Vendas acima do detectado", "N descidas: verifique o sensor ou vendas sem descida" |
| Detected, sold and justified are all 0 | Grey | "Sem movimento neste dia" |
| `clock_suspect_trips` above 0 | Amber | "Confira os horários", "N descidas com horário suspeito entraram neste dia" |
| Otherwise | Green | "Dia conferido" |

The "Não foi possível conferir" row was chosen by the owner, so a dead device is never
read as a quiet day. It is meant for a device that stays on when the tirolesa is closed.
If it is switched off, closed days show this message too. It applies even when sales
exist, because the cause is already known, and it replaces the "Dispositivo não visto"
warning so the same message does not appear twice.

The first row applies whichever `status` the API returns, on any date, because the
audit cannot be trusted without setup. In that state the cards, the Justificativas
panel and the footer are hidden. Inactive devices count as registered, so deactivating
a device never hides past results; with no active device, the tab shows the warning
"Nenhum dispositivo ativo" above the date selector.

The today row applies before any result row, so an unfinished day never reads as
checked or raises a false alarm. Its cards and Justificativas panel still show, and
justifying is allowed.

Days before the device was installed are not treated specially, because the API does
not say when setup happened. Sales on those days read as "Vendas acima do detectado".

Loading uses a spinner in the content area. A failed request shows the error with a
"Tentar novamente" button, and never a verdict.

### Justification modal

Fields: Quantidade (whole number, minimum 1), Tipo (Teste, Cortesia, Outro), Motivo
(required, and not whitespace only). The date is shown, not editable. Saving posts to
`POST /tirolesa/audit/justifications` and reloads the audit, so the verdict updates. The
modal stays open and shows the error if saving fails.

Removing a justification asks for confirmation ("Isso altera o resultado do dia"), then
reloads the audit.

### Configuração tab

**Dispositivos:** list with name, Online or Offline or Inativo, and last seen. "Novo
dispositivo" asks for a name. "Desativar" and "Reativar" call `PUT /tirolesa/devices/{id}`,
with confirmation before deactivating.

After a device is created, `DeviceKeyNotice` shows the key with a copy button and the
warning "Esta chave não será mostrada novamente". It stays until dismissed, and the key
is held only in component state, never in storage. There is no way to view a key later:
to replace one, deactivate the device and create a new one.

**Produtos da tirolesa:** list with product name and units per descent, each with a
remove button and confirmation. To link one, pick from active products not yet linked,
using `productService`, and set "Unidades por descida" with a default of 1 and the hint
"Use 1 para solo e tandem vendidos como uma descida".

### Contract files

Copy `tirolesa.md` into `specs/api/`, and update `shared.md` and `users.md` to match
`gestur-api`. Add `tirolesa` to the contract list in `CLAUDE.md`.

## Left to the builder

- Component internals and Tailwind classes, following `components/Buggyman/` and
  `components/HR/`.
- Exact loading and confirmation UI, reusing existing modal patterns.
- Hook return shapes.
