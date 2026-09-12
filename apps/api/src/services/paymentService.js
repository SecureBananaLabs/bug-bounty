import Stripe from "stripe";

let cachedStripeClient;

export class PaymentServiceError extends Error {
  constructor(message, { statusCode = 400, code, cause } = {}) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.cause = cause;
    this.expose = true;
  }
}

function requirePositiveIntegerAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError(
      "Payment amount is required and must be a positive integer in the smallest currency unit."
    );
  }

  return amount;
}

function normalizeCurrency(currency = "usd") {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError("Payment currency must be a three-letter ISO currency code.");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("Payment metadata must be an object when provided.");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value == null || typeof value === "object" || typeof value === "function") {
        throw new PaymentServiceError("Payment metadata values must be strings, numbers, or booleans.");
      }

      return [key, String(value)];
    })
  );
}

function getStripeClient() {
  if (cachedStripeClient) {
    return cachedStripeClient;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create Stripe payment intents.", {
      statusCode: 500,
      code: "STRIPE_NOT_CONFIGURED"
    });
  }

  cachedStripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return cachedStripeClient;
}

function wrapStripeError(error) {
  if (error instanceof PaymentServiceError) {
    return error;
  }

  return new PaymentServiceError(error?.message ?? "Stripe payment intent creation failed.", {
    statusCode: 502,
    code: error?.type ?? error?.code ?? error?.name,
    cause: error
  });
}

export async function createPaymentIntent(payload = {}, { stripeClient } = {}) {
  const amount = requirePositiveIntegerAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);

  const request = { amount, currency };
  if (metadata) {
    request.metadata = metadata;
  }

  try {
    const paymentIntent = await (stripeClient ?? getStripeClient()).paymentIntents.create(request);

    if (!paymentIntent?.id || !paymentIntent?.client_secret) {
      throw new PaymentServiceError("Stripe PaymentIntent response did not include id and client_secret.", {
        statusCode: 502,
        code: "STRIPE_RESPONSE_INCOMPLETE"
      });
    }

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount ?? amount,
      currency: paymentIntent.currency ?? currency,
      provider: "stripe"
    };
  } catch (error) {
    throw wrapStripeError(error);
  }
}
