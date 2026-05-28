import { Request, Response } from 'express';
import { createPaymentIntent } from './paymentService';

interface PaymentPayload {
  amount: number;
  currency?: string;
}

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const payload: PaymentPayload = req.body;
    
    // Validate amount
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    // Set default currency if not provided
    const currency = payload.currency || 'usd';
    
    // Create payment intent
    const paymentIntent = await createPaymentIntent(payload);
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentIntent = async (req: Request, res: Response) => {
  // Implementation here
};