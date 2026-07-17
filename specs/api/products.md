# Products API

## Endpoints

GET /products/

POST /products/ → 201

GET /products/{product_id}

PUT /products/{product_id}

DELETE /products/{product_id} → 204

POST /products/stock/update → 201

GET /products/stock/changes?product_id={uuid}   # product_id optional filter

---

## Product

```text
id
name
type      # free string; the ProductType enum (SERVICE/CONSUMABLE) exists but isn't enforced at the API layer
default_price
stock_quantity
active
created_at
updated_at
```

---

## Update Stock (POST /products/stock/update)

Request body is a **JSON array**, not a single object:

```text
[
  {
    product_id
    change_type   # StockChangeType
    quantity_change
    reason        # nullable
    sale_id       # nullable
  }
]
```

Response is `[{ id }]` — only the created stock-change IDs are echoed back, no other
fields.

---

## Stock Changes (GET /products/stock/changes)

Response is a richer, nested shape (different from the create request above):

```text
[
  {
    id
    change_type
    quantity_change
    reason        # nullable
    created_at
    product: { id, name, stock_quantity }
    sale: { id, sale_code }   # nullable
    user: { id, name }
  }
]
```