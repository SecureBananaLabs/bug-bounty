import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia', // 使用 stable API 版本
});

/**
 * 创建 Stripe PaymentIntent 并返回 client_secret
 * @param {Object} payload - { amount: number, currency?: string, metadata?: Object }
 * @returns {Promise<{paymentId: string, clientSecret: string, amount: number, currency: string}>}
 */
export async function createPaymentIntent(payload) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payload.amount * 100), // Stripe 以分为单位
      currency: (payload.currency ?? 'usd').toLowerCase(),
      metadata: {
        ...(payload.metadata || {}),
      },
    });

    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    };
  } catch (error) {
    // 将 Stripe 错误转换为应用层错误并重新抛出
    const appError = new Error('Payment processing failed');
    appError.statusCode = error.statusCode || 500;
    appError.stripeErrorType = error.type;
    appError.stripeCode = error.code;
    throw appError;
  }
}
