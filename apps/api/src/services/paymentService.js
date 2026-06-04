const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');

class PaymentService {
  async createPaymentIntent({ amount, currency, userId, jobId }) {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      metadata: {
        userId,
        jobId: jobId || ''
      }
    });

    // Save payment record to database
    const payment = new Payment({
      stripePaymentIntentId: paymentIntent.id,
      userId,
      jobId: jobId || null,
      amount,
      currency: currency || 'usd',
      status: 'requires_payment_method'
    });
    await payment.save();

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      jobId: payment.jobId
    };
  }

  async confirmPayment(paymentIntentId, userId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Update payment status in database
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId, userId },
      { status: paymentIntent.status },
      { new: true }
    );

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      jobId: payment.jobId
    };
  }

  async getPaymentIntent(paymentIntentId, userId) {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      userId
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      jobId: payment.jobId,
      createdAt: payment.createdAt
    };
  }
}

module.exports = new PaymentService();