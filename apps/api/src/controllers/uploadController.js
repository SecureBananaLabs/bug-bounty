const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/**
 * Upload a file
 * POST /api/uploads
 */
exports.uploadFile = [
  upload.single('file'),
  (req, res) => {
    // Check if file was provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please attach a file with the field name "file".'
      });
    }

    // File uploaded successfully
    return res.status(201).json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  }
];
