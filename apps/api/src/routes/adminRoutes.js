const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");

const adminRoutes = express.Router();

/**
 * Admin middleware — verify user has admin role.
 * Must be applied AFTER authMiddleware so req.user is populated.
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }
  next();
}

adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);
adminRoutes.get("/metrics", (req, res) => {
  res.json({ activeUsers: 42, totalJobs: 128, revenue: "$12,400" });
});

module.exports = adminRoutes;
