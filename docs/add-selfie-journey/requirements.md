# Requirements Document - Journey Registration with Mandatory Selfie Proof

## Introduction
This enhancement makes selfie proof mandatory during journey registration. The frontend must require a selfie image from the employee, send it together with geolocation using the backend contract for `POST /journey/`, and expose the returned selfie reference to administrators for verification.

## Frontend Scope and Boundaries
- The frontend is responsible for: selfie capture/selection UX, client-side validation, `multipart/form-data` request composition, and admin visualization behavior.
- The backend is responsible for: image optimization, storage provider integration, and persistence details.
- Any backend blob/image-processing implementation detail is out of frontend scope.

## Requirements

### R1. Mandatory Selfie for Journey Registration
- **User Story**: As an employee, I want to provide a selfie while registering my journey so identity proof is always attached to the record.
- **Acceptance Criteria**:
  - WHEN the employee attempts to register a journey without a selfie THEN the system SHALL block submission.
  - WHEN selfie is missing THEN the UI SHALL show a clear validation message indicating selfie is required.
  - WHEN selfie is provided and valid THEN the UI SHALL allow submission (subject to geolocation and network constraints).
  - WHEN camera capture is unavailable on the device THEN the UI SHALL still provide file upload selection to fulfill the mandatory selfie requirement.

### R2. API Contract Compliance for Journey Registration
- **User Story**: As a system integrator, I want the frontend request format to match the OpenAPI contract so journey registration works consistently.
- **Acceptance Criteria**:
  - WHEN registering a journey THEN the frontend SHALL send `POST /journey/` as `multipart/form-data`.
  - The request payload SHALL include required fields: `latitude`, `longitude`, and `selfie`.
  - The frontend SHALL keep geolocation capture mandatory before allowing final submit.
  - The frontend SHALL not send journey registration as JSON for this endpoint.
  - WHEN backend returns `422 Validation Error` THEN the UI SHALL present a user-friendly error and keep the form available for retry.

### R3. Journey Data Model Supports `selfie_id`
- **User Story**: As a frontend developer, I want journey response types to include selfie reference data so the UI can render proof actions safely.
- **Acceptance Criteria**:
  - Journey response types SHALL include optional `selfie_id` as returned by API.
  - WHEN `selfie_id` is absent THEN existing journey history rendering SHALL remain functional.
  - Type definitions and exports SHALL remain consistent with current type organization patterns.

### R4. Admin Visibility of Selfie Proof
- **User Story**: As an admin, I want to access selfie proof from journey records so I can verify registration authenticity.
- **Acceptance Criteria**:
  - WHEN admin journey records include `selfie_id` THEN the UI SHALL expose a visible action to open/view the selfie proof.
  - WHEN `selfie_id` is missing THEN the UI SHALL display a clear fallback state (for example, "No selfie") without breaking table layout.
  - WHEN selfie link cannot be opened (invalid/expired reference) THEN the UI SHALL show an actionable error message and keep admin workflow usable.

### R5. Error Handling and UX States
- **User Story**: As an employee or admin, I want clear feedback for validation and upload problems so I can complete journey workflows without confusion.
- **Acceptance Criteria**:
  - WHEN file type is unsupported or file is invalid THEN the UI SHALL reject the file and show a descriptive validation message.
  - WHEN device permission is denied for camera/file access THEN the UI SHALL explain how to proceed (retry, grant permission, or upload alternative file if available).
  - WHEN registration is in progress THEN submit controls SHALL present loading feedback and prevent duplicate submissions.
  - WHEN network/backend failure happens during submit THEN the UI SHALL show a non-silent error and allow retry without page reload.

## Traceability Notes
- `R1` maps to mandatory selfie UX and validation behavior.
- `R2` maps to OpenAPI contract alignment for `POST /journey/`.
- `R3` maps to frontend journey typing updates for optional `selfie_id`.
- `R4` maps to admin-side selfie proof visibility.
- `R5` maps to error, permission, and loading state expectations.