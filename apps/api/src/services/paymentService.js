import Stripe from "stripe";

let stripe = null;

function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-04-10",
    });
  }
  return stripe;
}

export function _setStripe(instance) {
  stripe = instance;
}

export function _resetStripe() {
  stripe = null;
}

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload.amount !== "number" || !Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw Object.assign(new Error("amount must be a positive integer in cents"), { status: 400 });
  }

  const currency = payload.currency ?? "usd";

  try {
    const client = getStripe();
    const paymentIntent = await client.paymentIntents.create({
      amount: payload.amount,
      currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (err) {
    if (err.message === "STRIPE_SECRET_KEY environment variable is required") {
      throw err;
    }
    if (err.type === "StripeCardError") {
      throw Object.assign(new Error(`Card error: ${err.message}`), { status: 402 });
    }
    if (err.type === "StripeInvalidRequestError") {
      throw Object.assign(new Error(`Invalid request: ${err.message}`), { status: 400 });
    }
    if (err.type === "StripeAuthenticationError") {
      throw Object.assign(new Error("Payment authentication failed"), { status: 401 });
    }
    if (err.type === "StripeRateLimitError") {
      throw Object.assign(new Error("Too many requests, please try again later"), { status: 429 });
    }
    throw Object.assign(new Error(`Payment processing failed: ${err.message}`), { status: 500 });
  }
}
