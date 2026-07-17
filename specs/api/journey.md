# Journey API

## Endpoints

GET /journey/ — returns only the caller's own journeys

POST /journey/ → 201

GET /journey/admin?user_id={uuid}&start_date={datetime}&end_date={datetime}

Requires: ADMIN. All query params optional.

PATCH /journey/{journey_id}

Requires: ADMIN.

DELETE /journey/{journey_id} → 204

Requires: ADMIN.

GET /journey/selfie?selfie_id={url}

Authentication: Not required. `selfie_id` (full selfie image URL) is required. Response is
raw `image/jpeg` bytes, not JSON.

---

## Journey

```text
id
user_id
timestamp
latitude
longitude
selfie_id   # nullable
```

Returned by POST /journey/, GET /journey/, GET /journey/admin, PATCH /journey/{id}.

---

## Register Journey (POST /journey/)

Request is `multipart/form-data`, not JSON:

```text
latitude   # form field
longitude  # form field
selfie     # file upload
```

---

## Update Journey (PATCH /journey/{journey_id})

```text
latitude      # optional
longitude     # optional
timestamp     # optional
edit_reason   # required
```