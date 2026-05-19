import { verifyToken } from "../utils/jwt.js";

/**
 * Admin-only middleware: verifies JWT and checks admin role.
 * Must be placed after authMiddleware (which sets req.user).
 * Rejects non-admin users with 403.
 */
export function adminMiddleware(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
