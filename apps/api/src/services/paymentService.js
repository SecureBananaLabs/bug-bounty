import Stripe from "stripe";

export class PaymentServiceError extends Error {
  constructor(message, status = 400, cause) {
    super(message);
    this.name = "PaymentServiceError";
    this.status = status;
    this.cause = cause;
  }
}

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents", 500);
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || value === undefined || typeof value === "object" || typeof value === "function") {
        throw new PaymentServiceError("metadata values must be primitive values");
      }

      return [key, String(value)];
    })
  );
}

function normalizePaymentPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentServiceError("payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentServiceError("amount is required and must be a positive integer in the smallest currency unit");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: normalizeMetadata(payload.metadata)
  };
}

export async function createPaymentIntent(payload, options = {}) {
  const request = normalizePaymentPayload(payload);
  const client = options.stripeClient ?? getStripeClient();
  const paymentIntentParams = {
    amount: request.amount,
    currency: request.currency
  };

  if (request.metadata) {
    paymentIntentParams.metadata = request.metadata;
  }

  try {
    const paymentIntent = await client.paymentIntents.create(paymentIntentParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? request.amount,
      currency: paymentIntent.currency ?? request.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new PaymentServiceError(error.message ?? "Stripe PaymentIntent creation failed", error.statusCode ?? 502, error);
  }
}
