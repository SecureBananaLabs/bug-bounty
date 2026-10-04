<content>
const { createPaymentIntent } = require('../services/paymentService');
const { z } = require('zod');

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.enum(['usd', 'eur', 'gbp'], {
    errorMap: () => ({ message: 'Invalid currency code' })
  })
});

const createPayment = async (req, res) => {
  try {
    const validatedPayload = paymentSchema.parse(req.body);
    
    const paymentIntent = await createPaymentIntent(validatedPayload);
    
    res.status(201).json({
      success: true,
      data: paymentIntent
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createPayment
};
</content>