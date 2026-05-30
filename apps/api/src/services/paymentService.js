import Stripe from "stripe";

// Initialize Stripe with a placeholder key
// In production, this should be loaded from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * Creates a Stripe PaymentIntent
 * @param {Object} payload - Payment payload
 * @param {number} payload.amount - Amount in cents
 * @param {string} [payload.currency="usd"] - Currency code
 * @param {Object} [payload.metadata] - Additional metadata
 * @returns {Object} PaymentIntent result with client_secret
 */
export async function createPaymentIntent(payload) {
  const { amount, currency = "usd", metadata = {} } = payload;
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      provider: "stripe",
    };
  } catch (err) {
    // Return a structured error instead of throwing
    // This allows the controller to handle Stripe errors gracefully
    console.error("Stripe error:", err.message);
    
    if (err.type === "StripeAuthenticationError") {
      const fallbackResult = {
        paymentId: `pay_fallback_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency,
        clientSecret: null,
        status: "requires_payment_method",
        provider: "stripe",
        error: "Stripe not configured (using placeholder key)",
        message: "Payment service is in demo mode. Configure STRIPE_SECRET_KEY for real payments.",
      };
      return fallbackResult;
    }
    
    throw err;
  }
}
