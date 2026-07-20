# Phase 1 Data Model: HR Journey Tab

This feature introduces **no new data model**. It relocates an existing, fully-functional
UI surface; every entity it displays or mutates already exists and is unchanged:

## Reused (unchanged): `JourneyResponse`, `User`, `JourneyAdminQueryParams`, `UpdateJourneyRequest`

Defined in `src/types/journey.ts` and `src/types/user.ts`, already re-exported via
`src/types/index.ts`. No fields are added, removed, or reinterpreted.

```text
JourneyResponse:      id, user_id, timestamp, latitude, longitude, selfie_id (nullable)
JourneyAdminQueryParams: user_id?, start_date?, end_date?
UpdateJourneyRequest: latitude?, longitude?, timestamp?, edit_reason (required)
```

## Reused (unchanged): `LatenessConfig`

Defined in `src/types/latenessConfig.ts`, consumed via `useLatenessConfig` — used by the
relocated tab purely to derive the existing "delayed" flag/filter, exactly as it did as a
standalone page. No changes.

## State ownership

| State | Owner | Notes |
|---|---|---|
| Journey record list, loading/error | `useJourney` hook (unchanged) | Same hook, same instance shape, now instantiated inside `HR/JourneyTab.tsx` instead of `Journey/AdminJourney.tsx` |
| Lateness config (for the delayed-flag/filter) | `useLatenessConfig` hook (unchanged) | Same as today |
| Employee/user list (for the employee filter dropdown) | Local `useState` + `userService.getAll()` inside the tab component (unchanged) | Same as today — not shared with `useEmployeePaychecks`'s employee data, since it needs the full user list (not just active employees), matching current behavior |
| Filter form (employee/date range, "only delayed") | Local `useState` inside the tab component (unchanged) | Same as today |
| Edit modal, selfie modal state | Local `useState` inside the tab component (unchanged) | Same as today |
| Which HR tab is active (`'employees' \| 'salary' \| 'journey' \| 'lateness'`) | `HR.tsx` (extended — adds the `'journey'` member) | The only actual state-shape change in this feature |
