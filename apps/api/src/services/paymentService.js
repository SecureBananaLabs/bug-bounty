import Stripe from "stripe";

let stripeClient;
let stripeClientSecret;

class PaymentServiceError extends Error {
  constructor(message, statusCode, cause) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.expose = true;
    this.cause = cause;
  }
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new PaymentServiceError(
      "STRIPE_SECRET_KEY environment variable is required",
      503
    );
  }

  if (!stripeClient || stripeClientSecret !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeClientSecret = secretKey;
  }

  return stripeClient;
}

function normalizeCurrency(currency) {
  const normalizedCurrency = String(currency ?? "usd").toLowerCase();

  if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
    throw new PaymentServiceError(
      "payload.currency must be a 3-letter currency code",
      400
    );
  }

  return normalizedCurrency;
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new PaymentServiceError("payload.metadata must be an object", 400);
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value === undefined || value === null) {
        throw new PaymentServiceError(
          "payload.metadata values must not be null or undefined",
          400
        );
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new PaymentServiceError(
          "payload.metadata values must be strings, numbers, or booleans",
          400
        );
      }

      return [key, String(value)];
    })
  );
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentServiceError("payload must be an object", 400);
  }

  if (payload.amount === undefined || payload.amount === null) {
    throw new PaymentServiceError(
      "payload.amount is required and must be a positive integer",
      400
    );
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentServiceError(
      "payload.amount must be a positive integer in the smallest currency unit",
      400
    );
  }

  return {
    amount: payload.amount,
    currency: normalizeCurrency(payload.currency),
    metadata: normalizeMetadata(payload.metadata)
  };
}

function buildStripeCreateParams(validatedPayload) {
  return {
    amount: validatedPayload.amount,
    currency: validatedPayload.currency,
    ...(validatedPayload.metadata
      ? { metadata: validatedPayload.metadata }
      : {})
  };
}

export async function createPaymentIntent(payload, client) {
  const validatedPayload = validatePaymentPayload(payload);
  const paymentClient = client ?? getStripeClient();

  try {
    const paymentIntent = await paymentClient.paymentIntents.create(
      buildStripeCreateParams(validatedPayload)
    );

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Stripe PaymentIntent creation failed";

    throw new PaymentServiceError(message, 502, error);
  }
}
