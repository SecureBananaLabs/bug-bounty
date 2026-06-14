const paymentService = require('../services/paymentService');

const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy', 'cny'];

const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency } = req.body;

    // Validate amount: must be a positive number
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount is required' });
    }
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ error: 'amount must be a number' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    // Default currency to 'usd' if omitted
    const normalizedCurrency = (currency || 'usd').toLowerCase();

    // Validate currency
    if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
      return res.status(400).json({
        error: `unsupported currency: ${currency}. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`
      });
    }

    const paymentIntent = await paymentService.createPaymentIntent(amount, normalizedCurrency);
    res.status(201).json(paymentIntent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent
};
