import jwt from "jsonwebtoken";

/**
 * Middleware: Require authenticated admin role
 * Must be placed AFTER general auth middleware
 */
export function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");

    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    return res.status(500).json({ error: "Authentication error" });
  }
}

/**
 * Middleware: Check admin role (for route-level guards in frontend)
 * Does NOT reject — just sets req.isAdmin for conditional rendering
 */
export function checkAdminRole(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
      req.isAdmin = decoded.role === "admin";
    } else {
      req.isAdmin = false;
    }
  } catch {
    req.isAdmin = false;
  }
  next();
}
