import { createPaymentIntent } from "../services/paymentService.js";
import { errorHandler } from "../middleware/errorHandler.js";

export async function createPayment(req, res, next) {
  try {
    const { amount, currency, metadata } = req.body;
    
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ 
        error: "Invalid amount", 
        message: "Amount must be a positive number" 
      });
    }
    
    const paymentData = {
      amount,
      currency: currency ?? "usd",
      metadata: metadata ?? {},
    };
    
    const result = await createPaymentIntent(paymentData);
    
    return res.status(201).json(result);
  } catch (err) {
    return errorHandler(err, req, res, next);
  }
}
