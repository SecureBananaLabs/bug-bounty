import Stripe from "stripe";

let _stripe = null;

function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  }
  return _stripe;
}

export class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export async function createPaymentIntent(payload) {
  const { amount, currency, metadata } = payload ?? {};

  if (amount === undefined || amount === null) {
    throw new PaymentValidationError("amount is required");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentValidationError(
      "amount must be a positive integer (smallest currency unit, e.g. cents)"
    );
  }

  const cur = currency ?? "usd";

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency: cur,
      metadata: metadata ?? {},
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe",
    };
  } catch (error) {
    if (error.type && error.type.startsWith("Stripe")) {
      throw new Error(error.message);
    }
    throw error;
  }
}
