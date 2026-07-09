const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'failed', 'canceled'],
    default: 'requires_payment_method'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);