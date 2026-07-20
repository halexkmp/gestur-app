# Contract: Journey tab relocation

This feature has no new backend endpoints and no new hook/service interface (see
`research.md`). The "contract" worth pinning down here is the exact set of wiring changes
across the three files this relocation touches, so `tasks.md` has an unambiguous checklist
and nothing is left half-migrated (e.g., an orphaned menu item or a duplicate route).

## Invariants (must hold before and after this change)

- `journeyService.ts` — unchanged, same exports, same signatures.
- `useJourney.ts` — unchanged, same exports (`history`, `loading`, `error`, `fetchHistory`,
  `registerJourney`, `fetchAdminHistory`, `updateJourney`, `deleteJourney`), same behavior.
- `EmployeeJourney.tsx` (self-service) — unchanged, not imported by or coupled to the moved
  component in any way.
- Whoever could see "Gerenciar Jornadas" before this change (`isSuperAdmin || isHR`, per
  `Layout.tsx`'s removed rule) can see the new Jornadas tab afterward, and no one else can.

## Component contract: `HR/JourneyTab.tsx`

```text
export default function JourneyTab(): JSX.Element
```

No props (matches `SalaryTab`, `LatenessConfigPanel`). Internally identical to the current
`AdminJourney.tsx`: owns its own `useJourney`/`useLatenessConfig` calls, its own `users`
list via `userService.getAll()`, its own filter/edit-modal/selfie-modal local state. Renders
the same filter card, results table (with lateness column/flag when a config is active), edit
modal (date/time + coordinates + required reason), and selfie viewer as today.

## Wiring changes (exhaustive — nothing outside this list should change)

1. **`src/components/HR/JourneyTab.tsx`** (new file): content of today's
   `src/components/Journey/AdminJourney.tsx`, renamed export `AdminJourney` → `JourneyTab`.
2. **`src/components/Journey/AdminJourney.tsx`**: deleted.
3. **`src/components/HR.tsx`**:
   - `activeTab` union type gains `'journey'`: `'employees' | 'salary' | 'journey' | 'lateness'`.
   - A new tab button "Jornadas" (icon `MapPin`) is added to the tab bar, positioned after
     "Salário" and before "Configuração de Atrasos".
   - The tab-content switch renders `<JourneyTab />` when `activeTab === 'journey'`.
4. **`src/components/Layout.tsx`**:
   - The `{ id: 'admin-journey', label: 'Gerenciar Jornadas', ... }` entry is removed from
     `menuItems`.
   - The `if (item.id === 'admin-journey') return isSuperAdmin || isHR;` line in
     `filteredMenuItems` is removed.
5. **`src/App.tsx`**:
   - The `import { AdminJourney } from './components/Journey/AdminJourney';` line is removed.
   - The `case 'admin-journey': return <AdminJourney />;` branch is removed from `renderPage`.

Nothing else changes. In particular: `EmployeeJourney.tsx`, the `'journey'` (self-service)
menu entry/page case, `useJourney.ts`, `journeyService.ts`, and every other HR tab are
untouched by this list.
