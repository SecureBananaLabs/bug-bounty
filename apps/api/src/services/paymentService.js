import Stripe from "stripe";

let stripeClient;
let stripeSecretKey;

export async function createPaymentIntent(payload) {
  const request = validatePaymentPayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(request);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentInputError) {
      throw error;
    }

    throw new PaymentProviderError(error?.message ?? "Stripe PaymentIntent creation failed");
  }
}

export function initStripe(secretKey = process.env.STRIPE_SECRET_KEY, client) {
  if (client) {
    stripeClient = client;
    stripeSecretKey = secretKey ?? "injected";
    return stripeClient;
  }

  if (!secretKey) {
    throw new PaymentInputError("STRIPE_SECRET_KEY is required to create a PaymentIntent");
  }

  if (!stripeClient || stripeSecretKey !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeSecretKey = secretKey;
  }

  return stripeClient;
}

export function resetStripeForTests() {
  stripeClient = undefined;
  stripeSecretKey = undefined;
}

export class PaymentInputError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export class PaymentProviderError extends Error {
  constructor(message) {
    super(message);
    this.status = 502;
  }
}

function getStripeClient() {
  return stripeClient ?? initStripe();
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentInputError("Payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentInputError("amount must be a positive integer in the smallest currency unit");
  }

  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);

  return {
    amount: payload.amount,
    currency,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {})
  };
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw new PaymentInputError("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata = {}) {
  if (metadata == null) {
    return {};
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentInputError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}
