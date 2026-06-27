# Tasks - Mandatory Selfie for Journey Registration

## Phase 1: Infra/Data
- [x] T1.1: Update journey registration request types to include mandatory selfie input plus coordinates (Plan: P1.1, Req: R1, R2, R3)
- [x] T1.2: Extend journey response/list types with optional `selfie_id` and keep compatibility for records without selfie reference (Plan: P1.1, Req: R3)
- [x] T1.3: Export updated journey types through `src/types/index.ts` barrel without breaking imports (Plan: P1.1, Req: R3)
- [x] T1.4: Refactor `journeyService.register` to send `FormData` with `latitude`, `longitude`, and `selfie` fields (Plan: P1.2, Req: R2)
- [x] T1.5: Document/normalize service error propagation for `422` validation feedback consumption in UI layer (Plan: P1.2, Req: R2, R5)

## Phase 2: Application Logic
- [x] T2.1: Update `useJourney.registerJourney` signature to require selfie input and preserve geolocation flow (Plan: P2.1, Req: R1, R2)
- [x] T2.2: Implement hook guard to block submit path when selfie is missing and surface descriptive error state (Plan: P2.1, Req: R1, R5)
- [x] T2.3: Ensure hook state mapping preserves optional `selfie_id` in journey collections used by UI (Plan: P2.2, Req: R3, R4)
- [x] T2.4: Validate hook loading/error transitions for permission denial, network failure, and retry scenarios (Plan: P2.1, Req: R5)

## Phase 3: User Interface
- [x] T3.1: Add mandatory selfie capture/upload input to employee journey registration UI with mobile/desktop fallback behavior (Plan: P3.1, Req: R1)
- [x] T3.2: Add client-side validation messaging for missing or invalid selfie file before submit (Plan: P3.1, Req: R1, R5)
- [x] T3.3: Show submission loading state and prevent duplicate registration attempts while request is in progress (Plan: P3.1, Req: R5)
- [x] T3.4: Update admin journey table/view to expose selfie proof action when `selfie_id` is available (Plan: P3.2, Req: R4)
- [x] T3.5: Add admin fallback/error UI for missing or broken selfie references without breaking journey management flow (Plan: P3.2, Req: R4, R5)

## Phase 4: Verification
- [x] T4.1: Add service tests asserting `register` sends `FormData` with required contract fields and handles `422` response shape (Plan: P4.1, Req: R2, R5)
- [x] T4.2: Add hook tests covering mandatory selfie validation, geolocation + selfie happy path, and retryable error paths (Plan: P4.2, Req: R1, R2, R5)
- [x] T4.3: Add employee component tests for selfie-required UI validation and loading/disabled submit behavior (Plan: P4.3, Req: R1, R5)
- [x] T4.4: Add admin component tests for selfie proof visibility action and missing/broken selfie fallback rendering (Plan: P4.3, Req: R4, R5)