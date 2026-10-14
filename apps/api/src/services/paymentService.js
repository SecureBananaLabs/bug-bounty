export async function createPaymentIntent(payload) {
  // Define server-side price map to prevent client-side amount manipulation
  const PRICE_MAP = {
    "standard_plan": 5000, // amounts in cents
    "premium_plan": 10000,
    "enterprise_plan": 50000,
  };

  const planId = payload.planId;
  const serverAmount = PRICE_MAP[planId] || 0;

  if (serverAmount === 0) {
    throw new Error("Invalid plan ID provided");
  }

  if (payload.amount !== serverAmount) {
    throw new Error("Payment amount mismatch. Please use the official pricing.");
  }

  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: serverAmount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
