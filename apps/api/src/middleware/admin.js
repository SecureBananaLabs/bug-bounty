export const adminMiddleware = (req, res, next) => {
  // Assuming req.user is attached by authMiddleware
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

export default adminMiddleware;
