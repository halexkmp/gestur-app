# Implementation Plan - Journey Registry

## Phase 1: Infrastructure & Data Layer (Infra)
- **P1.1: Type Definitions**: Define interfaces for Journey records, requests, and responses.
  - File: `src/types/journey.ts`
  - Integration: Export from `src/types/index.ts`.
- **P1.2: API Service**: Implement the `journeyService` to communicate with the back-end endpoints.
  - File: `src/services/journeyService.ts`
  - Endpoints: `POST /journey/`, `GET /journey/`, `GET /journey/admin`, `PUT /journey/{id}`, `DELETE /journey/{id}`.

## Phase 2: Application Logic (Application)
- **P2.1: Journey Hook**: Create `useJourney` hook to manage registration, fetching history, and administrative actions.
  - File: `src/hooks/useJourney.ts`
  - Responsibilities: Geolocation handling, state management for journeys, error handling.

## Phase 3: User Interface (UI)
- **P3.1: Employee Journey View**: Component for employees to register their journey and view history.
  - File: `src/components/Journey/EmployeeJourney.tsx`
  - Features: "Register Journey" button, geolocation error display, reverse chronological list.
- **P3.2: Admin Journey Management**: Component for admins to search, edit, and soft-delete journey records.
  - File: `src/components/Journey/AdminJourney.tsx`
  - Features: Search by user/date, edit modal with "reason" field, soft-delete.
- **P3.3: App Integration**: Update main `App.tsx` and Navigation to include the new Journey module.

## Phase 4: Security & Profiles
- **P4.1: Role Management**: Update User components to support the "EMPLOYEE" role.
- **P4.2: Access Control**: Ensure only users with appropriate roles can access their respective journey UIs.
- **P4.3: Menu Visibility**: Restrict navigation menu for users with only the "EMPLOYEE" role.
  - Logic: If roles = ["EMPLOYEE"], show only "journey" menu item.

## Phase 5: Verification
- **P5.1: Unit Tests**: Test `journeyService` and `useJourney` hook.
- **P5.2: Component Tests**: Test UI components for correct rendering and interaction.
