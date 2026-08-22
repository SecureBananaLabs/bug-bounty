import { Router } from 'express';
import { upload } from '../../middleware/upload.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadController } from '../../controllers/upload.controller';

const router = Router();

router.post('/uploads', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided',
      message: 'File is required for upload'
    });
  }
  // Pass to the original controller
  uploadController.uploadFile(req, res);
});

export default router;