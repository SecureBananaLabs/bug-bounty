export function adminMiddleware(req, res, next) {
  // Assuming authMiddleware has already run and populated req.user
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
}
