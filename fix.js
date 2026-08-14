```javascript
import Stripe from "stripe";

/**
 * Secure Payment Gateway Service
 * 
 * Integrates the Stripe Node.js SDK to create PaymentIntents.
 * Handles validation, error mapping, and client initialization using
 * the STRIPE_SECRET_KEY environment variable.
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  appInfo: { name: "SecurePaymentService", version: "1.0.0" }
});

/**
 * Creates a Stripe PaymentIntent based on the provided payload.
 * 
 * @param {Object} payload - The object containing amount (required) and optionally currency.
 * @returns {Promise<Object>} Object containing paymentId and clientSecret.
 * @throws {Error} If payload validation fails or Stripe API throws an error.
 */
export async function createPaymentIntent(payload) {
  // 1. Validate 'amount' is present and numeric (Criterion 3)
  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    throw new Error(`PaymentIntent payload 'amount' must be a positive number.`);
  }

  // 2. Ensure amount is normalized to an integer (cents) for Stripe's currency
  const amount = Math.round(payload.amount);

  // 3. Handle 'currency', defaulting to "usd" if not provided (Criterion 4)
  const currency = payload.currency ?? "usd";

  try {
    // 4. Execute the API call with at least amount and currency (Criterion 5)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        sourceId: payload.sourceId // Optional metadata from payload if needed
      }
    });

    // 5. Return specific shape requested (Criterion 6)
    // Maps 'id' to 'paymentId' and 'client_secret' to 'clientSecret'
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };

  } catch (err) {
    // 6. Handle Stripe-specific errors (Criterion 8)
    // Re-throw with original message preserved, handling both standard Errors and Stripe objects.
    if (err.message) {
      // If it's a Stripe object (e.g., StripeCardError), it often carries the message.
      // We re-throw to let the caller handle it (as per "re-thrown" criterion).
      throw err; 
    }

    // Fallback for generic errors
    throw new Error(`PaymentIntent creation failed: ${err.message || err}`);
  }
}
```