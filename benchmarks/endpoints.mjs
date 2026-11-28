/**
 * Mechanical endpoint inventory for SecureBananaLabs/bug-bounty#30.
 *
 * Derived 1:1 from apps/api/src/app.js (mount points) +
 * apps/api/src/routes/*.js (method + sub-path). Do NOT hand-edit the list to
 * guess endpoints — update it when routes change so coverage stays verifiable.
 *
 * auth: "required"  -> Bearer benchmark token is attached (admin routes use
 *                      authMiddleware and 401 without it).
 * auth: "public"    -> reachable without a token; the runner still attaches
 *                      the token where harmless so authenticated-path latency
 *                      is also observed. Public-only latency is measured
 *                      without the header first (see run.mjs).
 */
export const ENDPOINTS = [
  { id: "health", method: "GET", path: "/health", auth: "public" },
  { id: "auth-register", method: "POST", path: "/api/auth/register", auth: "public", payload: "register" },
  { id: "auth-login", method: "POST", path: "/api/auth/login", auth: "public", payload: "login" },
  { id: "auth-oauth-callback", method: "GET", path: "/api/auth/oauth/github/callback", auth: "public" },
  { id: "auth-refresh", method: "POST", path: "/api/auth/refresh", auth: "public", payload: "empty" },
  { id: "users-list", method: "GET", path: "/api/users/", auth: "public" },
  { id: "users-create", method: "POST", path: "/api/users/", auth: "public", payload: "user" },
  { id: "jobs-list", method: "GET", path: "/api/jobs/", auth: "public" },
  { id: "jobs-create", method: "POST", path: "/api/jobs/", auth: "public", payload: "job" },
  { id: "proposals-list", method: "GET", path: "/api/proposals/", auth: "public" },
  { id: "proposals-create", method: "POST", path: "/api/proposals/", auth: "public", payload: "proposal" },
  { id: "payments-create", method: "POST", path: "/api/payments/", auth: "public", payload: "payment" },
  { id: "reviews-list", method: "GET", path: "/api/reviews/", auth: "public" },
  { id: "reviews-create", method: "POST", path: "/api/reviews/", auth: "public", payload: "review" },
  { id: "messages-list", method: "GET", path: "/api/messages/", auth: "public" },
  { id: "messages-create", method: "POST", path: "/api/messages/", auth: "public", payload: "message" },
  { id: "notifications-list", method: "GET", path: "/api/notifications/", auth: "public" },
  { id: "notifications-create", method: "POST", path: "/api/notifications/", auth: "public", payload: "notification" },
  { id: "uploads-create", method: "POST", path: "/api/uploads/", auth: "public", payload: "upload" },
  { id: "search", method: "GET", path: "/api/search/?q=landing+page", auth: "public" },
  { id: "admin-metrics", method: "GET", path: "/api/admin/metrics", auth: "required" },
];
