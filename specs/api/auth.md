# Authentication API

## Login

POST /auth/login

Authentication

Not required

Content-Type

application/x-www-form-urlencoded

### Request

| Field | Type | Required |
|---------|------|----------|
| username | string | ✅ |
| password | string | ✅ |

### Response

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```