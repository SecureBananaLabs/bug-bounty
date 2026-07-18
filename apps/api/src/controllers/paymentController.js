const paymentService = require('../services/paymentService');

const createPayment = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    const userId = req.user.id;
    const paymentData = req.body;
    const payment = await paymentService.createPayment(userId, paymentData);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const listPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await paymentService.listPayments(userId);
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.id;
    const payment = await paymentService.getPayment(userId, paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  listPayments,
  getPayment
};
