import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadController } from '../controllers/upload';

const router = Router();

// Add validation to ensure file exists
router.post('/uploads', authenticate, (req, res, next) => {
  // Check if file was actually uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided',
      message: 'File is required for upload'
    });
  }
  // Delegate to the original controller if file exists
  uploadController.uploadFile(req, res);
});

export default router;