import Stripe from 'stripe';

// Initialize Stripe once at the module level
// Ensure STRIPE_SECRET_KEY is set in the environment
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe operations may fail if not configured.");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use a recent stable API version
});

export async function createPaymentIntent(payload) {
  // 1. Validate amount
  const { amount, currency, metadata } = payload;

  if (!amount || typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    throw new Error('Invalid amount: must be a positive integer (e.g., cents)');
  }

  // 2. Default currency
  const finalCurrency = currency ?? 'usd';

  // Basic validation for currency format (Stripe will do more robust validation for valid ISO codes)
  if (typeof finalCurrency !== 'string' || finalCurrency.length !== 3) {
    // For now, we'll rely on Stripe's API to validate if it's a supported currency code.
  }

  // Prepare parameters for Stripe API call
  const params = {
    amount,
    currency: finalCurrency,
    // Pass through metadata if it's a plain object, addressing maintainer feedback.
    ...(metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { metadata } : {}),
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    // 3. Return mapped response with Stripe's IDs and client secret
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount, // Return the amount confirmed by Stripe
      currency: paymentIntent.currency, // Return the currency confirmed by Stripe
      provider: "stripe"
    };
  } catch (error) {
    // 4. Handle Stripe API errors and re-throw with original message
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe API Error: ${error.message}`);
    } else {
      // Log unexpected errors for debugging and re-throw a generic message
      console.error("Unexpected error during Stripe PaymentIntent creation:", error);
      throw new Error("An unexpected error occurred while creating the payment intent.");
    }
  }
}
