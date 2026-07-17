# Sales API

## Endpoints

GET /sales/

POST /sales/ → 201

GET /sales/{sale_id}

PUT /sales/{sale_id} — response is a minimal `{ id, sale_code }` only, unlike every other endpoint below

---

## Sale

Response for GET /sales/, POST /sales/:

```text
id
sale_code
partner_id   # nullable
user_id
status
total_amount
notes         # nullable
observations  # nullable
created_at
items: SaleItem[]
payments: Payment[]
```

Response for GET /sales/{sale_id} is the same shape except the field is named `partner`
instead of `partner_id` (code inconsistency, not intentional versioning).

Create request (POST /sales/):

```text
partner_id                  # nullable
items: SaleItemCreate[]     # min 1
payments: SalePaymentCreate[]  # min 1
notes                       # nullable
observations                # nullable
partner_customer_quantity   # nullable, write-only — feeds reports' PartnerCustomer records
partner_customer_shift      # nullable, PartnerCustomerShift — write-only
```

Update request (PUT /sales/{sale_id}, all optional):

```text
partner_id
status         # SaleStatus
notes
observations
items: SaleItemUpdate[]
payments: SalePaymentUpdate[]
modified_by    # free string
```

---

## Sale Item

Request fields:

```text
product_id
quantity
unit_price
```

Response adds:

```text
id
total_price
```

---

## Payment

Request fields:

```text
payment_method
amount
```

Response adds:

```text
id
```