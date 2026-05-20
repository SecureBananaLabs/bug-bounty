import Stripe from "stripe";

let stripe = null;

function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

export async function createPaymentIntent(payload) {
  if (!payload || payload.amount === undefined || payload.amount === null) {
    throw new Error("Amount is required");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  const currency = payload.currency ?? "usd";

  try {
    const stripeClient = getStripe();
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
      metadata: payload.metadata || {}
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
