import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {"critical" | "high" | "medium" | "low"} Severity
 * @typedef {{
 *   id: string,
 *   title: string,
 *   severity: Severity,
 *   file: string,
 *   description: string,
 *   remediation: string
 * }} Finding
 */

/**
 * @param {string} repoRoot
 * @param {string} relativePath
 */
function readRepoFile(repoRoot, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return fs.readFileSync(absolutePath, "utf8");
}

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function detectLowHangingFruit(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  const envSource = readRepoFile(repoRoot, "apps/api/src/config/env.js");
  if (envSource?.includes('"development-secret"') || envSource?.includes("'development-secret'")) {
    findings.push({
      id: "LHF-001",
      title: "Bug: JWT secret falls back to insecure hardcoded default",
      severity: "critical",
      file: "apps/api/src/config/env.js",
      description:
        "`jwtSecret` defaults to `development-secret` when `JWT_SECRET` is unset. Tokens are forgeable in any environment that omits the variable.",
      remediation:
        "Require `JWT_SECRET` in non-development environments and fail fast when it is missing or uses a known insecure default."
    });
  }

  const authService = readRepoFile(repoRoot, "apps/api/src/services/authService.js");
  if (authService?.includes("TODO: verify password hash") || authService?.includes("signAccessToken({ sub: \"usr_existing\"")) {
    findings.push({
      id: "LHF-002",
      title: "Bug: Login issues tokens without verifying credentials",
      severity: "critical",
      file: "apps/api/src/services/authService.js",
      description:
        "`loginUser` ignores the provided password and always returns a signed JWT. Authentication is effectively bypassed.",
      remediation:
        "Look up the user, compare a password hash, and only mint tokens after a successful credential check."
    });
  }

  const authController = readRepoFile(repoRoot, "apps/api/src/controllers/authController.js");
  const refreshIsUnvalidated =
    Boolean(authController?.includes("async function refresh")) &&
    Boolean(authController?.includes("refreshToken()")) &&
    !Boolean(authController?.match(/refreshToken\([^)]+\)/));

  if (refreshIsUnvalidated) {
    findings.push({
      id: "LHF-003",
      title: "Bug: Unauthenticated /api/auth/refresh mints JWTs without credentials",
      severity: "critical",
      file: "apps/api/src/controllers/authController.js",
      description:
        "`POST /api/auth/refresh` calls `refreshToken()` with no refresh token, cookie, or request body validation, so anyone can mint valid access tokens.",
      remediation:
        "Require and validate a refresh token (or session cookie) before issuing a new access token."
    });
  }

  const authValidator = readRepoFile(repoRoot, "apps/api/src/validators/auth.js");
  if (authValidator?.includes('"admin"') || authValidator?.includes("'admin'")) {
    findings.push({
      id: "LHF-004",
      title: "Bug: Registration allows client-chosen admin role",
      severity: "high",
      file: "apps/api/src/validators/auth.js",
      description:
        "`registerSchema` accepts `role: \"admin\"`, enabling privilege escalation at signup when that role is copied into the JWT.",
      remediation:
        "Restrict public registration roles to `client` and `freelancer`. Assign admin only through a privileged, audited path."
    });
  }

  const adminRoutes = readRepoFile(repoRoot, "apps/api/src/routes/adminRoutes.js");
  const adminHasRoleGate =
    Boolean(adminRoutes?.includes("requireAdmin")) ||
    Boolean(adminRoutes?.match(/role\s*===?\s*["']admin["']/)) ||
    Boolean(adminRoutes?.includes("authorize("));

  if (adminRoutes?.includes("authMiddleware") && !adminHasRoleGate) {
    findings.push({
      id: "LHF-005",
      title: "Bug: /api/admin routes authenticate but never authorize admin role",
      severity: "high",
      file: "apps/api/src/routes/adminRoutes.js",
      description:
        "Admin routes apply `authMiddleware` only. Any valid JWT can call `GET /api/admin/metrics` because there is no role check.",
      remediation:
        "Add a `requireAdmin` (or equivalent) middleware that rejects non-admin roles with 403."
    });
  }

  const sensitiveRouteFiles = [
    "apps/api/src/routes/paymentRoutes.js",
    "apps/api/src/routes/uploadRoutes.js",
    "apps/api/src/routes/messageRoutes.js",
    "apps/api/src/routes/userRoutes.js",
    "apps/api/src/routes/proposalRoutes.js",
    "apps/api/src/routes/reviewRoutes.js",
    "apps/api/src/routes/notificationRoutes.js"
  ];

  const unauthenticatedSensitive = sensitiveRouteFiles.filter((relativePath) => {
    const source = readRepoFile(repoRoot, relativePath);
    return source && !source.includes("authMiddleware");
  });

  if (unauthenticatedSensitive.length > 0) {
    findings.push({
      id: "LHF-006",
      title: "Bug: Sensitive API write/list routes missing authentication middleware",
      severity: "high",
      file: unauthenticatedSensitive[0],
      description:
        `The following route modules expose sensitive operations without \`authMiddleware\`: ${unauthenticatedSensitive.join(", ")}.`,
      remediation:
        "Apply `authMiddleware` (and ownership checks where needed) to payments, uploads, messages, users, proposals, reviews, and notifications mutations/lists."
    });
  }

  const uploadRoutes = readRepoFile(repoRoot, "apps/api/src/routes/uploadRoutes.js");
  if (uploadRoutes?.includes("memoryStorage()") && !uploadRoutes.includes("limits")) {
    findings.push({
      id: "LHF-007",
      title: "Bug: /api/uploads lacks file size limits and type filtering",
      severity: "high",
      file: "apps/api/src/routes/uploadRoutes.js",
      description:
        "Multer uses unbounded `memoryStorage()` with no `limits.fileSize` or `fileFilter`, enabling memory exhaustion and arbitrary file uploads.",
      remediation:
        "Set explicit size limits, restrict MIME types, and keep uploads behind authentication."
    });
  }

  const paymentService = readRepoFile(repoRoot, "apps/api/src/services/paymentService.js");
  const paymentController = readRepoFile(repoRoot, "apps/api/src/controllers/paymentController.js");
  if (
    paymentService &&
    paymentController &&
    !fs.existsSync(path.join(repoRoot, "apps/api/src/validators/payment.js"))
  ) {
    findings.push({
      id: "LHF-008",
      title: "Bug: Payment creation accepts unvalidated amount and currency",
      severity: "medium",
      file: "apps/api/src/services/paymentService.js",
      description:
        "Payment intents accept `req.body` without a Zod (or similar) schema for amount/currency, risking invalid or abusive payment records.",
      remediation:
        "Add a payment validator requiring a positive amount and an allowlisted currency code before creating intents."
    });
  }

  const appSource = readRepoFile(repoRoot, "apps/api/src/app.js");
  if (appSource?.includes("cors()") && !appSource.includes("origin:")) {
    findings.push({
      id: "LHF-009",
      title: "Bug: CORS configured without an origin allowlist",
      severity: "medium",
      file: "apps/api/src/app.js",
      description:
        "`app.use(cors())` enables the default permissive CORS policy with no origin allowlist.",
      remediation:
        "Configure an explicit `origin` allowlist (and credentials policy) for non-local environments."
    });
  }

  const rateLimitSource = readRepoFile(repoRoot, "apps/api/src/middleware/rateLimit.js");
  if (rateLimitSource?.includes("limit: 200")) {
    findings.push({
      id: "LHF-010",
      title: "Bug: Global API rate limiter is overly permissive",
      severity: "low",
      file: "apps/api/src/middleware/rateLimit.js",
      description:
        "The shared limiter allows 200 requests / 15 minutes per client, which is weak protection for auth and payment endpoints.",
      remediation:
        "Tighten global limits and add stricter per-route limiters for `/api/auth` and `/api/payments`."
    });
  }

  return findings;
}
