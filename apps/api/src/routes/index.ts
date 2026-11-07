import { Router } from 'express';
import uploadsRouter from './uploads';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/uploads', uploadsRouter);

export default router;