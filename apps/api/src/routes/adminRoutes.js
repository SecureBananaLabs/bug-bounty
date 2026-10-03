<content>
const express = require('express');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { metrics } = require('../controllers/adminController');

const adminRoutes = express.Router();

// All admin routes require authentication
adminRoutes.use(authMiddleware);

// All admin routes require admin role
adminRoutes.use(requireAdmin);

adminRoutes.get('/metrics', metrics);

module.exports = adminRoutes;
</content>