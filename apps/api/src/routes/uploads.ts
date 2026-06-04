import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/uploads
 * Upload a file
 * 
 * Requirements:
 * - User must be authenticated
 * - Request must include a file in the 'file' field
 * 
 * Returns:
 * - 201: File uploaded successfully
 * - 400: No file provided or invalid request
 * - 401: User not authenticated
 */
router.post(
  '/',
  authenticate,
  uploadMiddleware,
  (req, res) => {
    // Check if file was actually uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'File is required for upload'
      });
    }

    // Process successful upload
    return res.status(201).json({
      success: true,
      fileId: req.file.filename,
      status: 'uploaded'
    });
  }
);

export default router;