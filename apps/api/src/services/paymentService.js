import Stripe from 'stripe';

let stripeClient = null;

function getStripe() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export async function createPaymentIntent(payload) {
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error("payload.amount is required");
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error("payload.amount must be a positive integer");
  }

  const currency = payload.currency ?? "usd";
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency,
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error.type && error.type.startsWith('Stripe')) {
      throw new Error(error.message);
    }
    throw error;
  }
}
