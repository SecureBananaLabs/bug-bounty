<content>
const { createPaymentIntent } = require('../services/paymentService');
const { z } = require('zod');

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().min(3, 'Currency code must be at least 3 characters'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  description: z.string().optional(),
  metadata: z.object({}).optional(),
});

const createPayment = async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedBody = paymentSchema.parse(req.body);
    
    // Create payment intent with validated data
    const paymentIntent = await createPaymentIntent(validatedBody);
    
    res.status(201).json({
      success: true,
      paymentIntent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors,
      });
    }
    
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createPayment,
};
</content>