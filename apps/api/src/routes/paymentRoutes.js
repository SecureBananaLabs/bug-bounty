const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// All payment routes require authentication
router.use(authenticate);

// POST /api/payments - Create a payment intent
router.post('/', paymentController.createPayment);

// GET /api/payments - List payments (optional)
router.get('/', paymentController.listPayments);

// GET /api/payments/:id - Get payment details
router.get('/:id', paymentController.getPayment);

module.exports = router;
