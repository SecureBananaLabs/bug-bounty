const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/uploads - Upload a file
router.post('/', uploadController.uploadFile);

module.exports = router;
