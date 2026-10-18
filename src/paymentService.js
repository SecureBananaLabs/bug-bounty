import { getStripeClient } from "./stripeClient.js";

const DEFAULT_CURRENCY = "usd";

/**
 * Validate and normalise the incoming payment payload.
 * @param {object} payload
 * @returns {{ amount: number, currency: string, metadata: object, description?: string }}
 */
function validatePayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("createPaymentIntent: payload must be a non-null object.");
  }

  const { amount, currency, metadata, description } = payload;

  if (amount === undefined || amount === null) {
    throw new TypeError(
      "createPaymentIntent: 'amount' is required and must be a positive integer in the smallest currency unit (e.g. cents)."
    );
  }

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError(
      `createPaymentIntent: 'amount' must be a finite number, received ${typeof amount}.`
    );
  }

  if (!Number.isInteger(amount)) {
    throw new TypeError(
      `createPaymentIntent: 'amount' must be an integer in the smallest currency unit, received ${amount}.`
    );
  }

  if (amount <= 0) {
    throw new RangeError(
      `createPaymentIntent: 'amount' must be a positive integer, received ${amount}.`
    );
  }

  let normalisedCurrency = DEFAULT_CURRENCY;
  if (currency !== undefined && currency !== null) {
    if (typeof currency !== "string" || currency.trim() === "") {
      throw new TypeError(
        "createPaymentIntent: 'currency' must be a non-empty string when provided."
      );
    }
    normalisedCurrency = currency.trim().toLowerCase();
  }

  let normalisedMetadata = {};
  if (metadata !== undefined && metadata !== null) {
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new TypeError(
        "createPaymentIntent: 'metadata' must be a plain object when provided."
      );
    }
    normalisedMetadata = { ...metadata };
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    throw new TypeError(
      "createPaymentIntent: 'description' must be a string when provided."
    );
  }

  return {
    amount,
    currency: normalisedCurrency,
    metadata: normalisedMetadata,
    description
  };
}

/**
 * Create a Stripe PaymentIntent and return the client secret to the caller.
 *
 * @param {object} payload
 * @param {number} payload.amount - Positive integer in the smallest currency unit.
 * @param {string} [payload.currency="usd"] - ISO currency code.
 * @param {object} [payload.metadata] - Optional metadata attached to the PaymentIntent.
 * @param {string} [payload.description] - Optional description.
 * @returns {Promise<{ paymentId: string, clientSecret: string, amount: number, currency: string, provider: string, status: string }>}
 */
export async function createPaymentIntent(payload) {
  const { amount, currency, metadata, description } = validatePayload(payload);

  const stripe = getStripeClient();

  const createParams = {
    amount,
    currency,
    automatic_payment_methods: { enabled: true }
  };

  if (Object.keys(metadata).length > 0) {
    createParams.metadata = metadata;
  }

  if (description !== undefined && description !== null) {
    createParams.description = description;
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(createParams);
  } catch (error) {
    // Preserve the original Stripe error message while adding context.
    const stripeMessage =
      error && typeof error.message === "string" && error.message.length > 0
        ? error.message
        : "Unknown Stripe error";

    const wrapped = new Error(
      `Stripe payment intent creation failed: ${stripeMessage}`
    );
    wrapped.name = error && error.name ? error.name : "StripeError";
    wrapped.type = error && error.type ? error.type : undefined;
    wrapped.code = error && error.code ? error.code : undefined;
    wrapped.statusCode = error && error.statusCode ? error.statusCode : undefined;
    wrapped.originalError = error;
    throw wrapped;
  }

  if (!paymentIntent || typeof paymentIntent.client_secret !== "string") {
    throw new Error(
      "Stripe payment intent creation failed: response did not include a client_secret."
    );
  }

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    provider: "stripe",
    status: paymentIntent.status
  };
}
