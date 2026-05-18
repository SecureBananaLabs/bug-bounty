import Stripe from "stripe";

let stripeClient;

export function initStripe(client = null) {
  stripeClient = client;
}

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent");
  }

  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payment payload is required");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("currency must be a three-letter ISO currency code");
  }

  if (payload.metadata !== undefined && (typeof payload.metadata !== "object" || Array.isArray(payload.metadata))) {
    throw new Error("metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: payload.metadata ?? {}
  };
}

export async function createPaymentIntent(payload) {
  const params = validatePaymentPayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error?.type?.startsWith("Stripe")) {
      throw new Error(error.message);
    }

    throw error;
  }
}
