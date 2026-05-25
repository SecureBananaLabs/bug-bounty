export async function createPaymentIntent(payload) {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY);
  
  if (!payload.amount) {
    throw new Error("Amount is required");
  }
  
  if (typeof payload.amount !== 'number' || payload.amount <= 0) {
  throw new Error("Invalid amount");
  }
  
  const intent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency ?? "usd"
  });
  
  return {
    paymentId: intent.id,
    clientSecret: intent.client_secret,
    status: intent.status
  };
}
export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
