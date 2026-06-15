const { createPaymentIntent, confirmPayment } = require('../services/paymentService');

async function handleCreatePaymentIntent(req, res) {
  try {
    const { amount, currency, metadata } = req.body;
    const result = await createPaymentIntent(amount, currency, metadata);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

async function handleConfirmPayment(req, res) {
  try {
    const { paymentIntentId } = req.params;
    const result = await confirmPayment(paymentIntentId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

module.exports = { handleCreatePaymentIntent, handleConfirmPayment };