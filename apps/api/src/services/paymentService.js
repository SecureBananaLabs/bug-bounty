import Stripe from "stripe";

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export class PaymentProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentProviderError";
  }
}

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new PaymentProviderError("STRIPE_SECRET_KEY is required to create payment intents");
  }

  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export function setStripeClientForTesting(client) {
  stripeClient = client;
}

function validatePayload(payload = {}) {
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError("amount must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("currency must be a 3-letter ISO currency code");
  }

  const metadata = payload.metadata ?? {};
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError("metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata
  };
}

export async function createPaymentIntent(payload) {
  const paymentPayload = validatePayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create(paymentPayload);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentPayload.amount,
      currency: paymentPayload.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentValidationError || error instanceof PaymentProviderError) {
      throw error;
    }

    throw new PaymentProviderError(error?.message ?? "Stripe payment intent creation failed");
  }
}
