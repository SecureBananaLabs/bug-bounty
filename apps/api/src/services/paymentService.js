const ALLOWED_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy', 'cny'];

export async function createPaymentIntent(payload) {
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  const currency = (payload.currency ?? 'usd').toLowerCase();
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return {
    paymentId: `pay_${Date.now()}`,
    amount,
    currency,
    provider: 'stripe'
  };
}
