<content>
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment intent
 *     description: Requires authentication.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount in cents
 *               currency:
 *                 type: string
 *                 description: 3-letter currency code
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                   description: The ID of the payment intent
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.post('/', authMiddleware, paymentController.createPayment);

module.exports = router;
</content>