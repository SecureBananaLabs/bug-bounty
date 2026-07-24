import Stripe from "stripe";

let stripeClient;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

function validatePaymentPayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("Payment amount must be a positive integer in the smallest currency unit");
  }

  if (
    payload.metadata !== undefined &&
    (typeof payload.metadata !== "object" || payload.metadata === null || Array.isArray(payload.metadata))
  ) {
    throw new Error("Payment metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    metadata: payload.metadata
  };
}

export async function createPaymentIntent(payload) {
  const { amount, currency, metadata } = validatePaymentPayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith("Stripe")) {
      throw new Error(`Stripe payment intent failed: ${error.message}`);
    }

    throw error;
  }
}

export function __setStripeClientForTest(client) {
  stripeClient = client;
}

export function __resetStripeClientForTest() {
  stripeClient = undefined;
}
