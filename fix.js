```javascript
import { Stripe } from 'stripe';

// Initialize the Stripe client using the environment variable
// Handles undefined gracefully or requires the env var to be set for real mode
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: { name: 'SecureBananaLabs-PaymentIntent' }
});

export async function createPaymentIntent(payload) {
  const { amount, currency } = payload;

  // 1. Validate Amount: Required and positive integer (cents)
  if (amount === undefined || amount === null) {
    throw new Error('Amount is required and must be a positive integer (cents)');
  }

  const validatedAmount = Number(amount);
  if (validatedAmount <= 0) {
    throw new Error(`Amount must be a positive number (cents): ${validatedAmount}`);
  }

  // 2. Validate Currency: Defaults to "usd" if provided as string or not provided
  const resolvedCurrency = typeof currency === 'string' ? currency : 'usd';

  try {
    // 3. Real Stripe API Call
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validatedAmount,
      currency: resolvedCurrency,
      metadata: {
        originalAmount: validatedAmount,
        source: 'createPaymentIntent'
      }
    });

    // 4. Return the mapped object
    // Criteria: paymentId mapped from paymentIntent.id
    // Criteria: clientSecret mapped from paymentIntent.client_secret
    return {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
      provider: 'stripe',
      status: paymentIntent.status
    };
  } catch (error) {
    // 5. Handle Stripe API Errors (CardError, InvalidRequest, etc.)
    // Criteria: Re-thrown with original Stripe error message preserved
    
    const message = error.message || String(error);

    // If it's a native JS Error or StripeError, preserve the object structure
    if (error.constructor?.name === 'StripeError' || error.constructor?.name === 'Error') {
      throw error;
    }

    throw new Error(`Stripe: ${message}`);
  }
}
```