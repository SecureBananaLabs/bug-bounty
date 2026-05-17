import Stripe from "stripe";

let stripeClient;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required to create payment intents");
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function validatePaymentPayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || currency.trim() === "") {
    throw new Error("currency must be a non-empty string");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
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
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith("Stripe")) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export function __setStripeClientForTest(client) {
  stripeClient = client;
}
