const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/uploads - Upload a file (requires multipart/form-data with 'file' field)
router.post('/', uploadController.uploadFile);

module.exports = router;
