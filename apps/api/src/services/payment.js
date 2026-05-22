import { stripe } from '@packages/stripe';
  if (payload.amount && payload.currency) {
    const { amount, currency } = payload;
    const paymentId = `pay_${Date.now()}`;
    const clientSecret = stripe.paymentIntents.create({
      amount,
      currency: currency || "usd"
    });
    return {
      paymentId,
      amount: payload.amount,
      currency: payload.currency || "usd",
      provider: "stripe"
    };
  }
}