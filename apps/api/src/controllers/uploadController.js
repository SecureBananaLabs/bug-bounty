const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/**
 * POST /api/uploads
 * Upload a file. Rejects requests without a file with 400.
 */
exports.uploadFile = [
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        status: 'no-file',
        message: 'No file provided. Please attach a file with the field name "file".'
      });
    }

    res.status(201).json({
      success: true,
      status: 'uploaded',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      }
    });
  }
];
