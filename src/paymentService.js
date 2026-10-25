import { getStripeClient } from "./stripeClient.js";

const DEFAULT_CURRENCY = "usd";

/**
 * Validate the incoming payment payload.
 *
 * @param {object} payload
 * @returns {{ amount: number, currency: string, metadata: object }}
 */
function validatePayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Payment payload must be a non-null object.");
  }

  const { amount, currency, metadata } = payload;

  if (amount === undefined || amount === null) {
    throw new TypeError("payload.amount is required.");
  }

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError("payload.amount must be a finite number.");
  }

  if (!Number.isInteger(amount)) {
    throw new TypeError("payload.amount must be an integer (smallest currency unit, e.g. cents).");
  }

  if (amount <= 0) {
    throw new RangeError("payload.amount must be a positive integer.");
  }

  let resolvedCurrency = DEFAULT_CURRENCY;
  if (currency !== undefined && currency !== null) {
    if (typeof currency !== "string" || currency.trim() === "") {
      throw new TypeError("payload.currency must be a non-empty string when provided.");
    }
    resolvedCurrency = currency.trim().toLowerCase();
  }

  let resolvedMetadata = {};
  if (metadata !== undefined && metadata !== null) {
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new TypeError("payload.metadata must be a plain object when provided.");
    }
    resolvedMetadata = { ...metadata };
  }

  return {
    amount,
    currency: resolvedCurrency,
    metadata: resolvedMetadata
  };
}

/**
 * Create a Stripe PaymentIntent and return the client secret to the caller.
 *
 * @param {object} payload
 * @param {number} payload.amount - Positive integer in the smallest currency unit.
 * @param {string} [payload.currency="usd"] - ISO currency code.
 * @param {object} [payload.metadata] - Optional metadata attached to the PaymentIntent.
 * @returns {Promise<{ paymentId: string, clientSecret: string, amount: number, currency: string, provider: string }>}
 */
export async function createPaymentIntent(payload) {
  const { amount, currency, metadata } = validatePayload(payload);

  const stripe = getStripeClient();

  const createParams = {
    amount,
    currency,
    automatic_payment_methods: { enabled: true }
  };

  if (Object.keys(metadata).length > 0) {
    createParams.metadata = metadata;
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(createParams);
  } catch (error) {
    // Preserve the original Stripe error message while surfacing a meaningful error.
    const message =
      error && typeof error.message === "string" && error.message.length > 0
        ? error.message
        : "Failed to create Stripe PaymentIntent.";

    const wrapped = new Error(`Stripe PaymentIntent creation failed: ${message}`);
    wrapped.name = error && error.name ? error.name : "StripeError";
    wrapped.type = error && error.type ? error.type : undefined;
    wrapped.code = error && error.code ? error.code : undefined;
    wrapped.statusCode = error && error.statusCode ? error.statusCode : undefined;
    wrapped.originalError = error;
    throw wrapped;
  }

  if (!paymentIntent || typeof paymentIntent.client_secret !== "string") {
    throw new Error("Stripe did not return a client_secret for the PaymentIntent.");
  }

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    provider: "stripe"
  };
}
