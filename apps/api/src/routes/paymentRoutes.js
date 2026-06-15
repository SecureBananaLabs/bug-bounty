const express = require('express');
const router = express.Router();
const { handleCreatePaymentIntent, handleConfirmPayment } = require('../controllers/paymentController');

router.post('/create-payment-intent', handleCreatePaymentIntent);
router.get('/confirm/:paymentIntentId', handleConfirmPayment);

module.exports = router;