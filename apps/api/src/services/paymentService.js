const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  if (!amount || amount <= 0) {
    throw new Error('Invalid payment amount');
  }

  const amountInCents = Math.round(amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  });

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
  };
}

async function confirmPayment(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    paymentId: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  };
}

module.exports = { createPaymentIntent, confirmPayment };