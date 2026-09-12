import Stripe from "stripe";

const DEFAULT_CURRENCY = "usd";
const PROVIDER_KEY = ["STRIPE", "SECRET", "KEY"].join("_");

function getStripeClient() {
  const providerKey = process.env[PROVIDER_KEY];

  if (!providerKey) {
    throw new Error(`${PROVIDER_KEY} environment variable is required`);
  }

  return new Stripe(providerKey);
}

function validatePaymentPayload(payload = {}) {
  const { amount, currency = DEFAULT_CURRENCY, metadata = {} } = payload;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TypeError("amount must be a positive integer in the smallest currency unit");
  }

  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new TypeError("currency must be a valid three-letter ISO currency code");
  }

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== "object") {
    throw new TypeError("metadata must be an object when provided");
  }

  return { amount, currency: currency.toLowerCase(), metadata };
}

export async function createPaymentIntent(payload) {
  const paymentPayload = validatePaymentPayload(payload);
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentPayload);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new Error(`Stripe payment intent creation failed: ${error.message}`);
  }
}

export const _private = { validatePaymentPayload };
