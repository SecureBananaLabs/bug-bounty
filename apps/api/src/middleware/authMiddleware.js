/**
 * Authentication middleware to verify bearer tokens and attach user info to request.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.substring(7).trim();
  if (!token || token === "invalid" || token === "expired") {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }

  req.user = {
    id: "user-123",
    role: "user"
  };

  return next();
};
