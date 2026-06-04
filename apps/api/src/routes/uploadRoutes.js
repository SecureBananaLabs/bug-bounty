const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');

// All upload routes require authentication
router.use(authMiddleware);

// POST /api/uploads - Upload a file (authenticated)
router.post('/', uploadController.upload);

module.exports = router;
