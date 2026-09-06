import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPaymentIntent, getPaymentMethods } from '../controllers/paymentController.js';

const router = Router();

// Require authentication for all payment routes
router.use(authenticate);

router.post('/', createPaymentIntent);
router.get('/methods', getPaymentMethods);

export { router as paymentRoutes };
