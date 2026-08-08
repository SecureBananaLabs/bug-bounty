import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Bearer token authentication middleware.
 * - Accepts case-insensitive "Bearer" scheme
 * - Validates token signature, algorithm, expiration, and sub claim
 * - Attaches decoded payload to req.user
 * - Returns 401 on any failure (no information leakage — same response for all failures)
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";

  // Split on first space: "Bearer <token>" or "bearer <token>"
  const spaceIdx = authHeader.indexOf(" ");
  if (spaceIdx === -1) {
    logAuthFailure(req, "missing authorization header format");
    return fail(res, "Unauthorized", 401);
  }

  const scheme = authHeader.slice(0, spaceIdx);
  const token = authHeader.slice(spaceIdx + 1).trim();

  if (scheme.toLowerCase() !== "bearer" || !token) {
    logAuthFailure(req, `invalid scheme or empty token: scheme="${scheme}"`);
    return fail(res, "Unauthorized", 401);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    logAuthFailure(req, `token verification failed: ${err.message}`);
    return fail(res, "Unauthorized", 401);
  }
}

/**
 * Require admin role — chain after authMiddleware.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    logAuthFailure(req, `admin access denied for sub=${req.user?.sub}`);
    return fail(res, "Forbidden", 403);
  }
  return next();
}

/**
 * Lightweight audit log for auth failures. Does NOT block the response.
 * In production, replace with structured logger (pino, winston, etc.)
 */
function logAuthFailure(req, reason) {
  const ts = new Date().toISOString();
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const path = req.originalUrl || req.url || "unknown";
  const method = req.method || "unknown";

  // Use stderr so it doesn't pollute stdout in production
  process.stderr.write(
    `[AUTH-FAIL ${ts}] ${method} ${path} from ${ip} — ${reason}\n`
  );
}
