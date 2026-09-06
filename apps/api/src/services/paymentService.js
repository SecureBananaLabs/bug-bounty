import Stripe from 'stripe';

export async function createPaymentIntent(payload, stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)) {
  // Validate amount is required and positive integer
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error('Amount is required and must be a positive integer (in smallest currency unit, e.g. cents)');
  }

  // Set currency with default
  const currency = payload.currency ?? "usd";

  try {
    // Create PaymentIntent with Stripe
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      // Add any metadata if provided
      ...(payload.metadata && { metadata: payload.metadata })
    });

    // Return clientSecret and paymentId
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    // Handle Stripe errors and preserve original message
    throw new Error(`Stripe error: ${error.message}`);
  }
}
