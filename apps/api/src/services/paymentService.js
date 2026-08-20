import Stripe from "stripe";

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payments", 500);
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  const normalized = String(currency).trim().toLowerCase();

  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return normalized;
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return {};
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [String(key), String(value)])
  );
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = normalizeAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const intent = await client.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true }
    });

    return {
      paymentId: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      provider: "stripe"
    };
  } catch (error) {
    throw new PaymentServiceError(
      error?.message || "Stripe payment intent creation failed",
      error?.statusCode || 502
    );
  }
}
