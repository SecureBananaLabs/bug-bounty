import { Router } from 'express';
import { uploadFile } from '../middleware/upload';

const router = Router();

router.post('/api/uploads', uploadFile, (req, res) => {
  // Check if file was actually uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided',
      message: 'File is required for upload'
    });
  }

  // Existing success response handling
  return res.status(201).json({
    success: true,
    status: "no-file" // This should be changed
  });
});