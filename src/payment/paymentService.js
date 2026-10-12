const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function createPaymentIntent(payload) {
  if (!payload || typeof payload.amount === "undefined" || payload.amount === null) {
    throw new Error("payload.amount is required");
  }

  if (
    !Number.isInteger(payload.amount) ||
    payload.amount <= 0
  ) {
    throw new Error("payload.amount must be a positive integer (smallest currency unit, e.g. cents)");
  }

  const currency = payload.currency ?? "usd";

  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency,
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
  };
}

module.exports = { createPaymentIntent };
