const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(payload) {
  // Validate payload
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency || 'usd',
      metadata: {
        integration_check: 'job-payment'
      }
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: payload.amount,
      currency: payload.currency || 'us
    };
  } catch (error) {
    if (error.type === 'StripeCardError' || 
        error.type === 'StripeInvalidRequestError' || 
        error.type === 'StripeAPIError' || 
        error.type === 'StripeAuthenticationError' || 
        error.type === 'StripePermissionError' || 
        error.type === 'StripeRateLimitError' || 
        error.type === 'StripeConnectionError' || 
        error.type === 'StripeSignatureVerificationError') {
      throw new Error(error.message);
    }
    throw error;
  }
}
