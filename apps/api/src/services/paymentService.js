import Stripe from "stripe";

// Read the key live (not cached) so tests and runtimes can set/unset
// STRIPE_SECRET_KEY freely. Never hardcode a key here.
function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY ?? "";
}

function getStripeClient() {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error(
      "Stripe is not configured: set the STRIPE_SECRET_KEY environment variable."
    );
  }
  return new Stripe(key);
}

function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new Error(
      "payment amount is required: pass a positive integer in the smallest currency unit (e.g. cents)."
    );
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      `invalid payment amount ${JSON.stringify(amount)}: must be a positive integer in the smallest currency unit (e.g. cents).`
    );
  }
}

export async function createPaymentIntent(payload = {}, { stripeClient } = {}) {
  validateAmount(payload.amount);
  const currency = String(payload.currency ?? "usd").toLowerCase();

  // stripeClient is injectable so unit tests can run without a real key.
  const stripe = stripeClient ?? getStripeClient();

  let intent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency,
      metadata: payload.metadata ?? {}
    });
  } catch (error) {
    const detail = error?.message ?? String(error);
    const code = error?.code ? ` [${error.code}]` : "";
    throw new Error(`Stripe payment intent creation failed${code}: ${detail}`);
  }

  return {
    paymentId: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    clientSecret: intent.client_secret,
    provider: "stripe"
  };
}
