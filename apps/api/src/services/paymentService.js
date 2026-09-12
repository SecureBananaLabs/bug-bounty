export async function createPaymentIntent(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  const normalizeCurrency = (value) => {
    if (typeof value !== 'string' || value.trim() === '') {
      return 'usd';
    }
    return value.trim().toLowerCase();
  };

  };
}
    amount,
    currency: normalizeCurrency(currency),
    status: 'requires_payment_method',
    ...rest,
  };
};

module.exports = { createPaymentIntent };
