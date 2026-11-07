import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer();

// Middleware to validate that a file was actually uploaded
const requireFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file provided in request'
    });
  }
  next();
};

// Upload endpoint that now properly validates file presence
router.post('/', upload.single('file'), requireFile, (req, res) => {
  return res.status(201).json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

export default router;