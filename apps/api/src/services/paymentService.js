import Stripe from "stripe";

export class PaymentServiceError extends Error {
  constructor(message, { statusCode = 400, cause } = {}) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

function validateAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError(
      "amount is required and must be a positive integer in the smallest currency unit"
    );
  }
}

function validateCurrency(currency) {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata == null) {
    return undefined;
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value == null || typeof value === "object") {
        throw new PaymentServiceError("metadata values must be primitive values");
      }

      return [key, String(value)];
    })
  );
}

function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payments", {
      statusCode: 500
    });
  }

  return new Stripe(secretKey);
}

function isStripeError(error) {
  return error?.type?.startsWith?.("Stripe") || error?.rawType?.startsWith?.("Stripe");
}

export async function createPaymentIntent(payload, options = {}) {
  const amount = payload?.amount;
  validateAmount(amount);

  const currency = validateCurrency(payload?.currency ?? "usd");
  const metadata = normalizeMetadata(payload?.metadata);
  const stripe = options.stripeClient ?? createStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      ...(metadata ? { metadata } : {})
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      provider: "stripe"
    };
  } catch (error) {
    if (isStripeError(error)) {
      throw new PaymentServiceError(error.message, {
        statusCode: error.statusCode ?? 502,
        cause: error
      });
    }

    throw error;
  }
}
