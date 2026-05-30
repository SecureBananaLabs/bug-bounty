import { env } from "../config/env.js";

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, status = 400, code = "PAYMENT_ERROR", cause) {
    super(message, { cause });
    this.name = "PaymentServiceError";
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}

function requirePositiveIntegerAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError(
      "amount is required and must be a positive integer in the smallest currency unit",
      400,
      "INVALID_PAYMENT_AMOUNT"
    );
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError(
      "currency must be a three-letter ISO currency code",
      400,
      "INVALID_PAYMENT_CURRENCY"
    );
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided", 400, "INVALID_PAYMENT_METADATA");
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)])
  );
}

async function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError(
      "STRIPE_SECRET_KEY is required to create Stripe payment intents",
      500,
      "STRIPE_NOT_CONFIGURED"
    );
  }

  if (!stripeClient) {
    const stripeModule = await import("stripe");
    const Stripe = stripeModule.default ?? stripeModule.Stripe ?? stripeModule;
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

function mapStripeError(error) {
  if (error instanceof PaymentServiceError) {
    return error;
  }

  return new PaymentServiceError(
    error?.message ?? "Stripe payment intent request failed",
    error?.statusCode ?? error?.status ?? 502,
    error?.type ?? "STRIPE_PAYMENT_ERROR",
    error
  );
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = requirePositiveIntegerAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const stripe = options.stripeClient ?? (await getStripeClient());

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      ...(metadata && Object.keys(metadata).length ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    throw mapStripeError(error);
  }
}
