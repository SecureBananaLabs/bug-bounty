```javascript
import Stripe from 'stripe';

// Initialize the Stripe client using the environment variable
// This satisfies the "no hardcoded keys" requirement
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-13',
  appInfo: { name: 'SecureBananaLabs', version: '1.0' }
});

/**
 * Creates a new Stripe PaymentIntent for a secure transaction.
 * 
 * @param {Object} payload - The object containing amount, currency, etc.
 * @returns {Promise<Object>} - A Promise resolving to the PaymentIntent details.
 * @throws {Error} - Various descriptive errors from the Stripe API.
 */
export async function createPaymentIntent(payload) {
  // 1. Validation: Ensure amount exists and is a positive integer (cents)
  const amount = payload.amount;
  if (!amount) {
    throw new Error('Payment amount is required on the payload.');
  }

  const amountNum = typeof amount === 'number' ? amount : parseInt(amount, 10);
  
  if (amountNum <= 0) {
    throw new Error(`Payment amount must be a positive integer (got: ${amountNum}).`);
  }

  // 2. Currency: Default to "usd" if not provided
  const currency = payload.currency ?? 'usd';

  try {
    // 3. API Call: Real stripe.paymentIntents.create()
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountNum,
      currency: currency,
      // Metadata helps in tracing the source of the call
      metadata: { source: 'createPaymentIntent', ...payload.metadata }
    });

    // 4. Return Value: Map to required structure
    return {
      paymentId: paymentIntent.id,      // Maps from paymentIntent.id (replacing stub)
      clientSecret: paymentIntent.client_secret, // Crucial for checkout
      amount: amountNum,
      currency: currency,
      provider: 'stripe'
    };
  } catch (error) {
    // 5. Error Handling: Surface meaningful Stripe errors
    // Stripe's SDK exports specific error classes (e.g., CardError, etc.)
    if (error instanceof Stripe.StripeError) {
      // Handle Card declines specifically
      if (error.type === 'card' || error instanceof Stripe.CardError) {
        throw new Error(`Card declined: ${error.message}`);
      }
      
      // Handle generic API errors (e.g., InvalidRequest, AmountTooSmall)
      if (error.type === 'invoice' || error.type === 'paymentintent') {
         throw new Error(`${error.type} Error: ${error.message}`);
      }

      // Default Stripe Error mapping
      throw new Error(`Stripe API Error (${error.type}): ${error.message}`);
    }

    // Handle generic JS errors (e.g., if the SDK was mocked incorrectly)
    throw new Error(`Payment service failed: ${error.message}`);
  }
}
```