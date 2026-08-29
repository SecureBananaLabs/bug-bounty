const createPaymentIntent = async (amount, currency) => {
  // Placeholder for Stripe integration
  // Currently returns a mock payment intent
  return {
    id: `pi_mock_${Date.now()}`,
    amount,
    currency,
    status: 'requires_payment_method',
    created: new Date().toISOString()
  };
};

module.exports = {
  createPaymentIntent
};
