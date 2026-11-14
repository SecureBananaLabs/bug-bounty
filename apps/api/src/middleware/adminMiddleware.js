/**
 * Middleware to restrict access to admin-only routes.
 *
 * Assumes `authMiddleware` has already run and populated `req.user`.
 * Returns 401 if no authenticated user is present, and 403 if the
 * authenticated user does not have the "admin" role.
 */
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }

  return next();
}

module.exports = adminMiddleware;
