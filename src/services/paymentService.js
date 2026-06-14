javascript
import Stripe from 'stripe';

// Initialize the Stripe SDK with your secret key.
// It's crucial to load this from environment variables (e.g., process.env.STRIPE_SECRET_KEY).
// Ensure this key is kept confidential and never exposed client-side.
// The Stripe client should be initialized once globally to avoid unnecessary overhead.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use a recent stable API version to ensure compatibility
  typescript: true, // Enable TypeScript support for better type checking
});

export async function createPaymentIntent(payload) {
  try {
    const { amount, currency } = payload;

    // Validate the amount strictly as per acceptance criteria:
    // "payload.amount is required and must be a positive integer (smallest currency unit, e.g. cents)"
    // This implies the amount is ALREADY in the smallest currency unit (e.g., cents for USD).
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(
        "Invalid or zero amount provided for PaymentIntent. Amount must be a positive integer in the smallest currency unit (e.g., cents)."
      );
    }

    // Ensure currency is lowercase and defaults to "usd" if not provided.
    const finalCurrency = (currency ?? "usd").toLowerCase();

    // Create a PaymentIntent using the Stripe Node.js SDK
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Use the validated amount directly as it's already in smallest currency unit
      currency: finalCurrency,
      payment_method_types: ['card'], // Explicitly specify payment method types for clarity
      // Optionally, add metadata here to associate the PaymentIntent with your internal order IDs, user IDs, etc.
      // metadata: {
      //   orderId: payload.orderId,
      //   userId: payload.userId,
      // },
    });

    // Return the client_secret and other relevant details from the created PaymentIntent
    // Mapping `client_secret` to `clientSecret` and `id` to `paymentId`
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount, // Return the original input amount for consistency with caller's context
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    // Handle Stripe API specific errors or general errors gracefully
    if (error instanceof Stripe.StripeError) {
      // Re-throw the original StripeError object to preserve its type, stack trace,
      // and specific properties (like code, decline_code, param).
      // This fulfills the acceptance criteria: "re-thrown with the original Stripe error message preserved"
      throw error;
    } else {
      // Catch any other unexpected errors during PaymentIntent creation
      // Re-throw a generic error with the original message for debugging purposes,
      // while ensuring a consistent error structure for the caller.
      throw new Error(`Failed to create payment intent due to an unexpected error: ${error.message || 'An unknown error occurred'}`);
    }
  }
}