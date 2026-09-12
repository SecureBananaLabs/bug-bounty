import Stripe from "stripe";

let stripeFactory = (secretKey) => new Stripe(secretKey);

export class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

export function setStripeFactoryForTests(factory) {
  stripeFactory = factory ?? ((secretKey) => new Stripe(secretKey));
}

function validatePaymentPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PaymentServiceError("Payment payload must be an object");
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new PaymentServiceError(
      "Payment amount is required and must be a positive integer in the smallest currency unit"
    );
  }

  const currency = (payload.currency ?? "usd").toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new PaymentServiceError("Payment currency must be a three-letter ISO currency code");
  }

  if (
    payload.metadata !== undefined &&
    (!payload.metadata || typeof payload.metadata !== "object" || Array.isArray(payload.metadata))
  ) {
    throw new PaymentServiceError("Payment metadata must be an object when provided");
  }

  return {
    amount: payload.amount,
    currency,
    metadata: payload.metadata
  };
}

export async function createPaymentIntent(payload) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY environment variable is required", 500);
  }

  const payment = validatePaymentPayload(payload);
  const stripe = stripeFactory(secretKey);
  const createPayload = {
    amount: payment.amount,
    currency: payment.currency
  };

  if (payment.metadata) {
    createPayload.metadata = payment.metadata;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(createPayload);

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payment.amount,
      currency: payment.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw new PaymentServiceError(error.message ?? "Stripe payment intent creation failed", 502);
  }
}
