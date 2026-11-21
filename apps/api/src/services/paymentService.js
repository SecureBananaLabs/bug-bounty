import Stripe from 'stripe';
import { env } from '../config/env.js';

export async function createPaymentIntent(payload, userId) {
  // 验证: amount 必须存在且 >= 50（分）
  if (!payload.amount || typeof payload.amount !== 'number' || payload.amount < 50 || !Number.isInteger(payload.amount)) {
    throw new Error('Invalid or missing amount (min 50 cents, integer)');
  }

  // 默认货币
  const currency = payload.currency || 'usd';

  // 初始化 Stripe
  const stripe = new Stripe(env.stripeSecretKey);

  // 创建 PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: currency,
    metadata: { jobId: payload.jobId || '', userId },
    automatic_payment_methods: { enabled: true },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
  };
}
