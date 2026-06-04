import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Validation middleware to ensure file is present
const validateFilePresence = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided in request'
    });
  }
  next();
};

// Upload endpoint
router.post('/', authenticate, uploadMiddleware, validateFilePresence, (req, res) => {
  // Process successful file upload
  res.status(201).json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

export default router;