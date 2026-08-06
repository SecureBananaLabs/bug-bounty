const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const paymentsService = require('../services/paymentsService');

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { amount, currency } = req.body;
        const userId = req.user.id;
        const payment = await paymentsService.createPaymentIntent({ amount, currency, userId });
        res.status(201).json(payment);
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;