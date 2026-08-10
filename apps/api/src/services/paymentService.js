import Stripe from "stripe";

let stripeClient = null;

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not defined.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export async function createPaymentIntent(payload) {
  const amount = payload.amount;
  
  if (amount === undefined || amount === null) {
    throw new Error("Amount is required.");
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer.");
  }

  const currency = payload.currency || "usd";

  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: payload.metadata || {}
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    };
  } catch (error) {
    throw new Error(error.message || "An error occurred with Stripe API.");
  }
}
