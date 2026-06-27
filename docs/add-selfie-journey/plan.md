# Implementation Plan - Mandatory Selfie for Journey Registration

## Objective
Implement frontend support for mandatory selfie proof in journey registration, aligned with backend OpenAPI contract for `POST /journey/` using `multipart/form-data` with required `latitude`, `longitude`, and `selfie`, and optional `selfie_id` in response.

## API Contract Notes
- Endpoint: `POST /journey/`
- Request: `multipart/form-data` (required body)
- Required fields: `latitude`, `longitude`, `selfie`
- Success response: `201` with `JourneyResponse` including optional `selfie_id`
- Validation response: `422` (`HTTPValidationError`) that must be translated into user-friendly feedback

## Phase 1: Infra/Data

### P1.1 Type updates for selfie-aware journey payloads
- Files: `src/types/journey.ts`, `src/types/index.ts`
- Define/update registration input type to support selfie file + coordinates.
- Extend response/list item types with optional `selfie_id`.
- Keep backward-safe optionality for records without selfie reference.

### P1.2 Service request adaptation to `FormData`
- File: `src/services/journeyService.ts`
- Update `register` to build `FormData` payload (`latitude`, `longitude`, `selfie`) and call API without forcing `Content-Type`.
- Preserve existing error propagation behavior and normalize validation failures for UI handling.

## Phase 2: Application Logic

### P2.1 Hook contract update for selfie input
- File: `src/hooks/useJourney.ts`
- Update `registerJourney` to require selfie file input and keep geolocation acquisition flow.
- Keep loading/error state transitions explicit for failed permission, validation, and network scenarios.

### P2.2 Hook data mapping for `selfie_id`
- File: `src/hooks/useJourney.ts`
- Ensure journey state keeps optional `selfie_id` from responses for downstream UI rendering.

## Phase 3: User Interface

### P3.1 Employee selfie capture/upload UX
- File: `src/components/Journey/EmployeeJourney.tsx`
- Add mandatory selfie input in registration form (camera capture where supported + file upload fallback).
- Validate missing/invalid selfie before submit.
- Display clear feedback for permission denial, invalid file, submission errors, and in-progress state.

### P3.2 Admin selfie proof visibility
- File: `src/components/Journey/AdminJourney.tsx`
- Add selfie proof action/column based on `selfie_id`.
- Provide fallback UI for missing selfie and graceful handling for broken/expired references.

## Phase 4: Verification

### P4.1 Service tests for multipart request and response typing
- File: `src/services/journeyService.test.ts`
- Verify `register` sends `FormData` with all required fields.
- Verify error handling path for `422` response.
- Verify `selfie_id` mapping in successful response.

### P4.2 Hook tests for mandatory selfie and error states
- File: `src/hooks/useJourney.test.ts`
- Verify submission is blocked without selfie.
- Verify geolocation + selfie happy path and request invocation.
- Verify permission/validation/network error paths.

### P4.3 Component tests for employee/admin selfie UX
- Files: `src/components/Journey/EmployeeJourney.test.tsx`, `src/components/Journey/AdminJourney.test.tsx`
- Employee: required selfie validation, loading state, and submit behavior.
- Admin: selfie visibility action, fallback when absent, and error feedback behavior.

## Delivery Notes
- Reuse conventions from `docs/register-journey/*` and current frontend architecture.
- Keep scope limited to frontend integration responsibilities; backend storage/optimization internals remain out of scope.