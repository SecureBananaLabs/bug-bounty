const express = require('express');
const router = express.Router();
const { authMiddleware, adminAuthorizationMiddleware } = require('../middleware');
const { getAdminMetrics } = require('../controllers/adminController');

router.get('/api/admin/metrics', authMiddleware, adminAuthorizationMiddleware, getAdminMetrics);

module.exports = router;
