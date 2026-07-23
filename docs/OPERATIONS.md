# Operations Guide - Admin Authorization

This document describes the design, configuration, and testing procedures for role-based authorization on admin routes.

## Admin Role Verification

The application implements role-based access control (RBAC) middleware in `apps/api/src/middleware/auth.js` to protect administrative endpoints.

### Design

1. **Token Authentication**: All requests to `/api/admin/*` must pass through `authMiddleware` which decodes and verifies a JSON Web Token (JWT) provided in the `Authorization` header. If the token is missing, expired, or invalid, the API rejects the request with a `401 Unauthorized` status.
2. **Role Enforcing**: The custom `requireRole(role)` middleware asserts that the authenticated user's token contains the designated role (e.g. `admin`). If a user is authenticated but has a different role (such as `client` or `freelancer`), the API rejects the request with a `403 Forbidden` status.

### Testing

The implementation is verified by tests in `apps/api/src/tests/admin.test.js`:
- **Unauthenticated**: Verifies that requests without a token are rejected with `401`.
- **Unauthorized Role**: Verifies that authenticated requests containing a non-admin role are rejected with `403`.
- **Authorized Admin**: Verifies that authenticated requests containing the `admin` role successfully access the metrics payload with status `200`.

Run the tests:
```bash
npm run test
```
