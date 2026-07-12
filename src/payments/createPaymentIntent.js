import Stripe from "stripe";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }
  return new Stripe(key);
}

/**
 * Create a Stripe PaymentIntent and return client-facing fields.
 * @param {{ amount: number, currency?: string, metadata?: Record<string, string> }} payload
 */
export async function createPaymentIntent(payload) {
  if (payload == null || payload.amount === undefined || payload.amount === null) {
    throw new Error("amount is required and must be a positive integer");
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error(
      "amount must be a positive integer (smallest currency unit, e.g. cents)"
    );
  }

  const currency = payload.currency ?? "usd";
  const params = { amount: payload.amount, currency };
  if (payload.metadata && typeof payload.metadata === "object") {
    params.metadata = payload.metadata;
  }

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create(params);
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (error) {
    // Preserve original Stripe error messages (StripeCardError, etc.)
    if (
      error &&
      (String(error.type || "").startsWith("Stripe") ||
        error.raw !== undefined ||
        String(error.constructor?.name || "").includes("Stripe"))
    ) {
      throw new Error(error.message);
    }
    throw error;
  }
}
