# Reports API

## Endpoints

GET /reports/sales

POST /reports/partner-customers

---

## GET /reports/sales

### Filters (query params, all optional)

date_from

date_to

user_id

product_id

partner_id

Note: for non-`ADMIN` callers, `user_id` is always overridden to the caller's own id —
non-admins can only ever see their own sales through this report regardless of what
`user_id` they pass.

### Response

```text
[
  {
    id
    sale_code
    total_amount
    partner_id     # nullable
    user: { id, name, username }
    status         # SaleStatus
    notes          # nullable
    observations   # nullable
    created_at
    items: [ { product_id, quantity, unit_price, total_price } ]
    payments: [ { payment_method, amount } ]
  }
]
```

---

## POST /reports/partner-customers

### Request

Body is a bare JSON array, not a wrapped object:

```text
[ sale_id, ... ]   # array of sale UUIDs
```

### Response

```text
[
  {
    id
    partner_id   # nullable
    sale_id
    quantity
    shift        # PartnerCustomerShift
  }
]
```