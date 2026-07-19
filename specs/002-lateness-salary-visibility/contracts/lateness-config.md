# Contract: Lateness Configuration (User Story 1)

Status: **Already live** — documented in `specs/api/employees.md`. Reproduced here only to
pin down exactly what the frontend consumes; `specs/api/employees.md` remains the source of
truth.

## GET /employees/lateness-config

**Auth**: Requires `HUMAN_RESOURCES` (or `ADMIN`/`isSuperAdmin` per this app's convention of
treating super admin as a superset).

**Response** `200`:

```json
{
  "enabled": false,
  "expected_entrance_time": "00:00:00",
  "tolerance_minutes": 0,
  "deduction_interval_minutes": 0,
  "deduction_value": 0
}
```

No configuration ever saved → disabled/all-zero defaults, not `404`. Frontend must render
this as a normal (not error) state — see spec Acceptance Scenario 1.

## PUT /employees/lateness-config

**Auth**: Requires `HUMAN_RESOURCES`.

**Request** (all fields required — full replace, no partial patch):

```json
{
  "enabled": true,
  "expected_entrance_time": "08:00:00-03:00",
  "tolerance_minutes": 10,
  "deduction_interval_minutes": 30,
  "deduction_value": 25.00
}
```

`expected_entrance_time` may be a bare time (`"08:00:00"`, assumed UTC) or carry an explicit
UTC offset (`"08:00:00-03:00"`, `"08:00:00Z"`); the backend converts any offset to true UTC
before storing. The frontend always sends the browser's local wall-clock time with its
current offset (`localTimeStringWithUtcOffset` in `lib/formatters.ts`), and converts the
UTC value from `GET`/the `PUT` response back to local time for display
(`utcTimeStringToLocal`).

**Response** `200`: same shape as `GET`.

**Errors**: `400` if `tolerance_minutes < 0`, `deduction_interval_minutes <= 0`, or
`deduction_value < 0`. Frontend validates the same rules client-side before submitting
(FR-004) to avoid a round-trip for obviously invalid input, but must still surface the `400`
message if the backend rejects for any other reason.

## Frontend consumption

- `services/latenessConfigService.ts`: `get(): Promise<LatenessConfig>`,
  `update(payload: LatenessConfig): Promise<LatenessConfig>`.
- `hooks/useLatenessConfig.ts`: loads on mount, exposes `save(values)` that validates
  client-side, calls the service, and surfaces success/error state to
  `LatenessConfigPanel.tsx`.
