const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { metrics } = require("../controllers/adminController");

const adminRoutes = express.Router();

// Verify the JWT is valid, then enforce the admin role.
adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get("/metrics", metrics);

module.exports = adminRoutes;
