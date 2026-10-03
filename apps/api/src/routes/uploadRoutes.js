<content>
const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// POST /api/uploads - Handle file uploads
router.post('/', upload.single('file'), uploadController.handleUpload);

module.exports = router;
</content>