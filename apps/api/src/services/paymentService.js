import Stripe from "stripe";

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, cause) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    if (cause) {
      this.cause = cause;
    }
  }
}

function getStripeClient() {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create Stripe PaymentIntents", 500);
    }

    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

function normalizeAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("payload.amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError("payload.currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("payload.metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || typeof value === "object") {
        throw new PaymentServiceError("payload.metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const client = options.stripeClient ?? getStripeClient();
  const createParams = { amount, currency };

  if (metadata) {
    createParams.metadata = metadata;
  }

  try {
    const paymentIntent = await client.paymentIntents.create(createParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    throw new PaymentServiceError(
      error?.message ?? "Stripe PaymentIntent creation failed",
      error?.statusCode ?? error?.status ?? 502,
      error
    );
  }
}
