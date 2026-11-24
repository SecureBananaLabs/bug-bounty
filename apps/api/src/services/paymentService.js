let _stripe = null;

/**
 * Inject a Stripe client instance for testing.
 * In production, the client is lazily created from STRIPE_SECRET_KEY.
 */
export function setStripeClient(client) {
  _stripe = client;
}

async function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    const Stripe = (await import("stripe")).default;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export async function createPaymentIntent(payload) {
  if (!payload.amount || typeof payload.amount !== "number" || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const currency = payload.currency ?? "usd";

  try {
    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    };
  } catch (err) {
    const StripeModule = await import("stripe");
    if (err instanceof StripeModule.default.errors.StripeError) {
      throw new Error(err.message);
    }
    throw err;
  }
}
