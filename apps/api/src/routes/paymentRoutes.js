import { Router } from 'express';
import { createPaymentIntent } from '../services/paymentService.js';

const router = Router();

router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const { amount, currency } = req.body;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }
    const result = await createPaymentIntent({ amount, currency });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export const paymentRoutes = router;
