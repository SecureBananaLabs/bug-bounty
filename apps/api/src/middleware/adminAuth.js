import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * adminAuth middleware.
 *
 * Stacks on top of authMiddleware semantics but re-verifies the JWT server-side
 * on EVERY admin request and enforces role === "ADMIN". A client-side guard
 * alone is never sufficient; this is the authoritative server-side check.
 */
export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  let payload;
  try {
    // Server-side verification of the token on every call — not a client claim.
    payload = verifyAccessToken(authHeader.slice(7));
  } catch {
    return fail(res, "Invalid token", 401);
  }

  // Role is resolved from the verified payload, never trusted from the client.
  const role = payload.role;
  if (role !== "admin" && role !== "ADMIN") {
    return fail(res, "Forbidden: admin access required", 403);
  }

  req.user = { sub: payload.sub, role: "ADMIN" };
  next();
}
