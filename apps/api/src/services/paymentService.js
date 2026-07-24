import { env } from "../config/env.js";

function getStripe() {
  const { default: Stripe } = await import("stripe");
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-06-20" });
}

// Validate payload before touching Stripe
function validatePayload(payload) {
  const amount = Number(payload?.amount);
  if (!payload?.amount || !Number.isInteger(amount) || amount <= 0) {
    throw new Object.assign(new Error("amount must be a positive integer (smallest currency unit, e.g. cents)"), { status: 400 });
  }
  return { amount, currency: (payload.currency ?? "usd").toLowerCase() };
}

export async function createPaymentIntent(payload) {
  const { amount, currency } = validatePayload(payload);

  // Allow tests to skip the real Stripe call via env flag
  if (process.env.STRIPE_MOCK === "true") {
    return {
      paymentId: "pi_test_mock",
      clientSecret: "pi_test_mock_secret_mock",
      amount,
      currency,
      provider: "stripe"
    };
  }

  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2024-06-20" });

  try {
    const intent = await stripe.paymentIntents.create({ amount, currency });
    return {
      paymentId: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
      provider: "stripe"
    };
  } catch (err) {
    // Preserve Stripe error message for the caller
    throw new Error(err.message ?? "Stripe error");
  }
}
