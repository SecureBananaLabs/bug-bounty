import Stripe from "stripe";

class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

let stripeClientForTests = null;
let stripeClient = null;
let stripeClientKey = null;

export function setStripeClientForTests(client) {
  stripeClientForTests = client;
}

export function resetStripeClientForTests() {
  stripeClientForTests = null;
  stripeClient = null;
  stripeClientKey = null;
}

function getStripeClient() {
  if (stripeClientForTests) {
    return stripeClientForTests;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create Stripe payments", 500);
  }

  if (!stripeClient || stripeClientKey !== process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    stripeClientKey = process.env.STRIPE_SECRET_KEY;
  }

  return stripeClient;
}

function normaliseCurrency(currency) {
  const value = currency ?? "usd";

  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return value.toLowerCase();
}

function normaliseMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value == null || typeof value === "object") {
        throw new PaymentServiceError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new PaymentServiceError("payment payload is required");
  }

  if (!Number.isSafeInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentServiceError("amount is required and must be a positive integer in the smallest currency unit");
  }

  return {
    amount: payload.amount,
    currency: normaliseCurrency(payload.currency),
    metadata: normaliseMetadata(payload.metadata)
  };
}

function isStripeError(error) {
  return Boolean(error && typeof error === "object" && typeof error.type === "string" && error.type.startsWith("Stripe"));
}

export async function createPaymentIntent(payload) {
  const request = validatePayload(payload);

  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: request.amount,
      currency: request.currency,
      ...(request.metadata ? { metadata: request.metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    if (isStripeError(error)) {
      throw new PaymentServiceError(error.message, 502);
    }

    throw error;
  }
}
