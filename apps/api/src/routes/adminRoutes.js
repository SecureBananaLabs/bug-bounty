<content>
const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const metrics = require("../controllers/adminController");

const adminRoutes = express.Router();

// All admin routes require authentication AND admin role
adminRoutes.use(authMiddleware, adminMiddleware);

adminRoutes.get("/metrics", metrics);

module.exports = adminRoutes;