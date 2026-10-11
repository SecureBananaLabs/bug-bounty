import Stripe from "stripe";

const DEFAULT_CURRENCY = "usd";

let stripeClient;

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export class PaymentProviderError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "PaymentProviderError";
  }
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentValidationError("STRIPE_SECRET_KEY is required to create a payment intent.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

function normalizeAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError(
      "amount is required and must be a positive integer in the smallest currency unit."
    );
  }

  return amount;
}

function normalizeCurrency(currency = DEFAULT_CURRENCY) {
  if (typeof currency !== "string" || currency.trim().length !== 3) {
    throw new PaymentValidationError("currency must be a three-letter ISO currency code.");
  }

  return currency.trim().toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError("metadata must be an object when provided.");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === null || value === undefined || typeof value === "object") {
        throw new PaymentValidationError(`metadata.${key} must be a string, number, or boolean.`);
      }

      return [key, String(value)];
    })
  );
}

function buildPaymentIntentParams(payload = {}) {
  const params = {
    amount: normalizeAmount(payload.amount),
    currency: normalizeCurrency(payload.currency)
  };

  const metadata = normalizeMetadata(payload.metadata);
  if (metadata) {
    params.metadata = metadata;
  }

  return params;
}

function isStripeError(error) {
  return typeof error?.type === "string" && error.type.startsWith("Stripe");
}

export async function createPaymentIntent(payload, options = {}) {
  const params = buildPaymentIntentParams(payload);
  const stripe = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    if (isStripeError(error)) {
      throw new PaymentProviderError(error.message, error);
    }

    throw error;
  }
}

export function resetStripeClientForTests() {
  stripeClient = undefined;
}
