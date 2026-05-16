import Stripe from "stripe";

const STRIPE_API_VERSION = "2024-06-20";
const STRIPE_ERROR_TYPES = new Set([
  "StripeAPIError",
  "StripeAuthenticationError",
  "StripeCardError",
  "StripeConnectionError",
  "StripeIdempotencyError",
  "StripeInvalidGrantError",
  "StripeInvalidRequestError",
  "StripePermissionError",
  "StripeRateLimitError",
  "StripeSignatureVerificationError"
]);

let cachedStripeClient;
let cachedStripeSecretKey;

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
    this.statusCode = 400;
  }
}

export class PaymentProviderError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "PaymentProviderError";
    this.statusCode = 502;
  }
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentValidationError("STRIPE_SECRET_KEY is required to create Stripe payments");
  }

  if (!cachedStripeClient || cachedStripeSecretKey !== secretKey) {
    cachedStripeClient = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION
    });
    cachedStripeSecretKey = secretKey;
  }

  return cachedStripeClient;
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentValidationError("Payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentValidationError("Payment amount is required and must be a positive integer");
  }

  const currency = payload.currency ?? "usd";
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentValidationError("Payment currency must be a three-letter ISO currency code");
  }

  return {
    amount: payload.amount,
    currency: currency.toLowerCase(),
    metadata: validateMetadata(payload.metadata)
  };
}

function validateMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentValidationError("Payment metadata must be an object when provided");
  }

  const entries = Object.entries(metadata);
  if (entries.length > 50) {
    throw new PaymentValidationError("Payment metadata cannot contain more than 50 keys");
  }

  return entries.reduce((normalized, [key, value]) => {
    if (typeof key !== "string" || key.length === 0 || key.length > 40) {
      throw new PaymentValidationError("Payment metadata keys must be 1 to 40 characters long");
    }

    if (value === null || value === undefined || typeof value === "object") {
      throw new PaymentValidationError("Payment metadata values must be strings, numbers, or booleans");
    }

    const stringValue = String(value);
    if (stringValue.length > 500) {
      throw new PaymentValidationError("Payment metadata values cannot exceed 500 characters");
    }

    normalized[key] = stringValue;
    return normalized;
  }, {});
}

function normalizeStripeError(error) {
  if (error?.type && STRIPE_ERROR_TYPES.has(error.type)) {
    return new PaymentProviderError(`Stripe payment failed: ${error.message}`, error);
  }

  return error;
}

export async function createPaymentIntent(payload, options = {}) {
  const validated = validatePaymentPayload(payload);
  const stripeClient = options.stripeClient ?? getStripeClient();
  const createParams = {
    amount: validated.amount,
    currency: validated.currency
  };

  if (validated.metadata) {
    createParams.metadata = validated.metadata;
  }

  try {
    const paymentIntent = await stripeClient.paymentIntents.create(createParams);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: validated.amount,
      currency: validated.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw normalizeStripeError(error);
  }
}

export function resetStripeClientForTests() {
  cachedStripeClient = undefined;
  cachedStripeSecretKey = undefined;
}
