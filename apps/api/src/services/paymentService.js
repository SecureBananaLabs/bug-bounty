import Stripe from "stripe";

const DEFAULT_CURRENCY = "usd";

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
  }
}

export class PaymentConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentConfigurationError";
    this.statusCode = 503;
  }
}

export class PaymentProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentProviderError";
    this.statusCode = 502;
  }
}

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentConfigurationError("STRIPE_SECRET_KEY is required to create a payment intent.");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function normalizeCurrency(currency) {
  if (currency === undefined || currency === null || currency === "") {
    return DEFAULT_CURRENCY;
  }

  if (typeof currency !== "string" || !/^[a-zA-Z]{3}$/.test(currency)) {
    throw new PaymentValidationError("currency must be a three-letter ISO currency code.");
  }

  return currency.toLowerCase();
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError("amount must be a positive integer in the smallest currency unit.");
  }

  return amount;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined || metadata === null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError("metadata must be an object when provided.");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === undefined || value === null) {
        throw new PaymentValidationError("metadata values must be strings, numbers, or booleans.");
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new PaymentValidationError("metadata values must be strings, numbers, or booleans.");
      }

      return [key, String(value)];
    })
  );
}

function isStripeError(error) {
  return error?.type?.startsWith?.("Stripe") || error?.raw || error?.rawType;
}

export async function createPaymentIntent(payload, options = {}) {
  const amount = validateAmount(payload?.amount);
  const currency = normalizeCurrency(payload?.currency);
  const metadata = normalizeMetadata(payload?.metadata);
  const client = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await client.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    if (isStripeError(error)) {
      throw new PaymentProviderError(`Stripe payment intent failed: ${error.message}`);
    }

    throw error;
  }
}
