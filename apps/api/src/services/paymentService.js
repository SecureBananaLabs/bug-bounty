const DEFAULT_CURRENCY = "usd";

let stripeClient;

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400, cause) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.expose = true;
    this.cause = cause;
  }
}

function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new PaymentServiceError("amount is required");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("amount must be a positive integer in the smallest currency unit");
  }

  return amount;
}

function normalizeCurrency(currency = DEFAULT_CURRENCY) {
  if (typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) {
    throw new PaymentServiceError("currency must be a three-letter ISO currency code");
  }

  return currency.toLowerCase();
}

function normalizeMetadata(metadata) {
  if (metadata === undefined) {
    return undefined;
  }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PaymentServiceError("metadata must be an object when provided");
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (typeof key !== "string" || key.length === 0) {
        throw new PaymentServiceError("metadata keys must be non-empty strings");
      }

      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new PaymentServiceError("metadata values must be strings, numbers, or booleans");
      }

      return [key, String(value)];
    })
  );
}

async function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create a Stripe PaymentIntent", 500);
  }

  const { default: Stripe } = await import("stripe");
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export async function createPaymentIntent(payload = {}, options = {}) {
  const amount = validateAmount(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const metadata = normalizeMetadata(payload.metadata);
  const client = options.stripeClient ?? (await getStripeClient());
  const params = { amount, currency };

  if (metadata) {
    params.metadata = metadata;
  }

  let paymentIntent;
  try {
    paymentIntent = await client.paymentIntents.create(params);
  } catch (error) {
    const message = error?.message ?? "Stripe PaymentIntent creation failed";
    throw new PaymentServiceError(`Stripe PaymentIntent creation failed: ${message}`, 502, error);
  }

  if (!paymentIntent?.id || !paymentIntent?.client_secret) {
    throw new PaymentServiceError("Stripe PaymentIntent response did not include id and client_secret", 502);
  }

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount,
    currency,
    provider: "stripe"
  };
}
