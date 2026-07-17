# Partners API

## Endpoints

GET /partners/

POST /partners/

GET /partners/{partner_id}

PUT /partners/{partner_id}

DELETE /partners/{partner_id} — no defined response body

GET /partners/by-type?type={PartnerType}   # type is REQUIRED

---

## Partner

```text
id
name
type
active
pix_key   # nullable everywhere except GET /partners/{id}, where it's non-nullable (code inconsistency)
created_at
```

GET /partners/by-type response adds a nested `loans: [{ id }][]` not present on any other
Partner response.

---

## Create Partner

```text
name
type
pix_key
active
```

---

## Update Partner

```text
name
active
pix_key   # accepted in the request but currently NOT persisted (known code gap, not just a doc gap)
```