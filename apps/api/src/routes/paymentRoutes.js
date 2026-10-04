<content>
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all payment routes
router.use(authMiddleware);

router.post('/', paymentController.createPayment);
router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPaymentById);

module.exports = router;
</content>