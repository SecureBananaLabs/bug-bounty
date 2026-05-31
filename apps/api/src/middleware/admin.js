export const adminMiddleware = (req, res, next) => {
  // Check if user exists and has admin role
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};

export default adminMiddleware;