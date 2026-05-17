import Stripe from "stripe";

/**
 * Stripe client initialised from environment.
 * Exported so tests can replace with a mock.
 */
export let stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-04-30.basil",
});

/**
 * Replace the stripe client (useful for testing).
 * @param {import("stripe").default} client
 */
export function setStripeClient(client) {
  stripe = client;
}

/**
 * Validate and transform the incoming payload.
 * Throws with a descriptive message on invalid input.
 */
function validatePayload(payload) {
  const amount = payload?.amount;
  if (amount === undefined || amount === null) {
    throw new Error("payload.amount is required");
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "payload.amount must be a positive integer (smallest currency unit, e.g. cents)"
    );
  }

  const currency = payload?.currency ?? "usd";
  if (typeof currency !== "string" || currency.length < 3) {
    throw new Error("payload.currency must be a 3-letter ISO code");
  }

  return { amount: Number(amount), currency: String(currency).toLowerCase() };
}

/**
 * Map a Stripe PaymentIntent to the legacy response shape.
 */
function mapPaymentIntent(paymentIntent) {
  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    provider: "stripe",
    status: paymentIntent.status,
  };
}

/**
 * Create a Stripe PaymentIntent from the given payload.
 *
 * @returns {{ clientSecret: string, paymentId: string, amount: number, currency: string, provider: "stripe", status: string }}
 * @throws {Error} Validation errors or Stripe API errors with the original message preserved.
 */
export async function createPaymentIntent(payload) {
  const { amount, currency } = validatePayload(payload);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return mapPaymentIntent(paymentIntent);
  } catch (err) {
    throw new Error(err.message);
  }
}