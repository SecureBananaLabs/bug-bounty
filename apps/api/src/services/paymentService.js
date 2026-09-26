import Stripe from "stripe";

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required to create payment intents");
  }

  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function validatePaymentPayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("payload.amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new Error("payload.currency must be a 3-letter ISO currency code");
  }

  if (payload.metadata !== undefined && (payload.metadata === null || typeof payload.metadata !== "object" || Array.isArray(payload.metadata))) {
    throw new Error("payload.metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    ...(payload.metadata ? { metadata: payload.metadata } : {})
  };
}

function normalizeStripeError(error) {
  const message = error?.message || "Stripe payment intent creation failed";

  if (error?.type?.startsWith("Stripe")) {
    throw new Error(`Stripe error: ${message}`);
  }

  throw error;
}

export function buildPaymentService({ stripe = getStripeClient() } = {}) {
  return {
    async createPaymentIntent(payload) {
      const paymentIntentPayload = validatePaymentPayload(payload);

      try {
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload);

        return {
          paymentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          provider: "stripe"
        };
      } catch (error) {
        normalizeStripeError(error);
      }
    }
  };
}

export async function createPaymentIntent(payload) {
  return buildPaymentService().createPaymentIntent(payload);
}
