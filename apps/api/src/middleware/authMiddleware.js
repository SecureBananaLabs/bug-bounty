export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing or invalid token" });
  }
  const token = authHeader.slice(7);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: token required" });
  }
  req.user = { token };
  next();
}
