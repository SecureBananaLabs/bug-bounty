const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createPaymentIntent } = require('../controllers/paymentController');

// POST /api/payments - Protected endpoint requiring authentication middleware
router.post('/', authMiddleware, createPaymentIntent);

module.exports = router;
