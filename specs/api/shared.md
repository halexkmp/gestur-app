# Shared API Contract

## Authentication

Authentication: OAuth2 Password Bearer

Header

Authorization: Bearer <access_token>

Content-Type: application/json

All endpoints require authentication unless noted "Not required" on the endpoint itself.
Exceptions: `POST /auth/login`, `GET /journey/selfie`.

---

## Permissions

Most endpoints only require a valid token (any role). Endpoints that require a specific
role are marked `Requires: <ROLE>` in their context file. Roles in use today:

- `Requires: ADMIN` — journey moderation (`GET /journey/admin`, `PATCH /journey/{id}`, `DELETE /journey/{id}`)
- `Requires: HUMAN_RESOURCES` — all `/employees/*` endpoints

`GET /users/` is a special case: it doesn't hard-block non-admins, but silently returns
only the caller's own user instead of the full list unless the caller is `ADMIN`.

---

## Pagination

No endpoint supports pagination (no `limit`/`offset`/`page` params). Every list endpoint
returns a bare JSON array of the full result set, filtered only by whatever query params
that endpoint documents.

---

## Error Response

### Validation Error (422)

```json
{
  "detail": [
    {
      "loc": ["body", "..."],
      "msg": "Validation error",
      "type": "..."
    }
  ]
}
```

---

# Common Enums

## UserRole

- ADMIN
- MANAGER
- HUMAN_RESOURCES
- OPERATOR
- EMPLOYEE

## PartnerType

- BUGGYMAN
- BUSINESS

## PaymentMethod

- PIX
- CURRENCY
- CREDIT_CARD
- BUSINESS_PARTNER

## LoanStatus

- ACTIVE
- PAID
- CANCELED

## LoanInstallmentStatus

- PENDING
- PARTIALLY_PAID
- PAID

## StockChangeType

- IN
- OUT

## SaleStatus

- COMPLETED
- PENDING
- CANCELED

## PartnerCustomerShift

- MORNING
- AFTERNOON

---

# Common Types

## UUID

String UUID v4

## Date

yyyy-MM-dd

## DateTime

ISO-8601 UTC

## Money

Decimal represented as string.