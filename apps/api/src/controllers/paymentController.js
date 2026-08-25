const paymentService = require('../services/paymentService');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency, jobId } = req.body;
    const userId = req.user.id;

    const paymentIntent = await paymentService.createPaymentIntent({
      amount,
      currency,
      userId,
      jobId
    });

    res.status(201).json({
      success: true,
      data: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        jobId: paymentIntent.jobId || null
      }
    });
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const paymentIntent = await paymentService.confirmPayment(paymentIntentId, userId);

    res.status(200).json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        jobId: paymentIntent.jobId || null
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentIntent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paymentIntent = await paymentService.getPaymentIntent(id, userId);

    res.status(200).json({
      success: true,
      data: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        jobId: paymentIntent.jobId || null,
        createdAt: paymentIntent.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentIntent
};