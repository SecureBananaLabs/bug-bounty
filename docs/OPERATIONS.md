# Operations Guide - Authentication Enforcements

This document outlines the authentication and security enforcements for proposals and payments in the API service.

## Enforced Authentication Gates

To secure proposal and payment creation, all requests to payments and proposals endpoints require a valid access token in the `Authorization` header.

### Secured Endpoints
The following endpoints reject unauthenticated requests with `401 Unauthorized`:

| Endpoint Path | HTTP Method | Required Role | Default Response (Unauthenticated) |
| :--- | :--- | :---: | :--- |
| `/api/payments` | `POST` | User | `401 Unauthorized` |
| `/api/proposals` | `GET` | User | `401 Unauthorized` |
| `/api/proposals` | `POST` | User | `401 Unauthorized` |

### Expected Request Format

Authenticated requests must include a valid bearer token:

```http
Authorization: Bearer <your_jwt_access_token>
```

#### Example Valid Proposal Request (POST)
```bash
curl -X POST http://127.0.0.1:4000/api/proposals \
  -H "Authorization: Bearer <valid_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Website Development", "amount": 1500}'
```

#### Example Blocked Request (No Header)
```bash
curl -X GET http://127.0.0.1:4000/api/proposals
# Returns: {"success":false,"message":"Unauthorized"}
```
