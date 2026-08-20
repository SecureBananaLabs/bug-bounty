import Stripe from 'stripe';

let stripeClient;
function getStripeClient() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not defined");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  }
  return stripeClient;
}

export function resetStripeClientForTest() {
  stripeClient = null;
}

export async function createPaymentIntent(payload) {
  if (!payload || typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
    throw new Error("Invalid amount: must be a positive integer.");
  }

  const currency = payload.currency || "usd";

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: currency
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    };
  } catch (error) {
    // Catch Stripe errors and re-throw with preserved message
    const message = error?.message || String(error);
    const err = new Error(message);
    err.name = error?.type || "StripeError";
    err.raw = error;
    throw err;
  }
}
