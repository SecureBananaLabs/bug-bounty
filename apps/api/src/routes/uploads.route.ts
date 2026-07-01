import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { uploadController } from '../controllers/upload.controller';

const router = express.Router();

// Add file validation middleware
const validateFile = (req, res, next) => {
  // The upload middleware should already be applied
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided',
      message: 'File is required for upload'
    });
  }
  next();
};

router.post('/api/uploads', 
  authenticate, 
  uploadController.uploadFile, 
  validateFile
);

export default router;