const express = require('express');
const adminRoutes = express.Router();
const { metrics } = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Apply authentication and admin authorization to all admin routes
adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

adminRoutes.get('/metrics', metrics);

module.exports = adminRoutes;
