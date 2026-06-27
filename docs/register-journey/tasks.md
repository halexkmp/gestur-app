# Tasks - Journey Registry

## Phase 1: Infrastructure & Data Layer (Infra)
- [x] T1.1: Create `src/types/journey.ts` with OpenAPI schemas (Plan: P1.1, Req: R1, R2, R3)
- [x] T1.2: Export journey types in `src/types/index.ts` (Plan: P1.1, Req: R1)
- [x] T1.3: Implement `src/services/journeyService.ts` for all endpoints (Plan: P1.2, Req: R1, R2, R3)

## Phase 2: Application Logic (Application)
- [x] T2.1: Implement `useJourney` hook with geolocation support (Plan: P2.1, Req: R1, R2)
- [x] T2.2: Implement admin search and modification logic in `useJourney` (Plan: P2.1, Req: R3)

## Phase 3: User Interface (UI)
- [x] T3.1: Create `EmployeeJourney` component for registration and history (Plan: P3.1, Req: R1, R2)
- [x] T3.2: Create `AdminJourney` component for management and corrections (Plan: P3.2, Req: R3)
- [x] T3.3: Integrate Journey module into `App.tsx` and Layout navigation (Plan: P3.3, Req: R4)

## Phase 4: Security & Profiles (Infra/Application)
- [x] T4.1: Update User creation/edit UI to include "EMPLOYEE" role (Plan: P4.1, Req: R4)
- [x] T4.2: Implement role-based route protection for Journey module (Plan: P4.2, Req: R5)
- [x] T4.3: Implement restricted menu visibility for pure "EMPLOYEE" users (Plan: P4.3, Req: R4)
- [x] T4.4: Implement automatic redirection to "My Journey" for pure employees (Plan: P4.4, Req: R4)

## Phase 5: Verification (Infra)
- [x] T5.1: Write unit tests for `journeyService.ts` (Plan: P5.1, Req: R1, R2, R3)
- [x] T5.2: Write unit tests for `useJourney.ts` hook (Plan: P5.1, Req: R1, R2, R3)
- [x] T5.3: Write component tests for `EmployeeJourney` and `AdminJourney` (Plan: P5.2, Req: R1, R2, R3)
