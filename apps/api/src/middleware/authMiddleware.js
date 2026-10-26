export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Attach a minimal user object; full JWT verification happens in production.
  req.user = { token };
  return next();
}
