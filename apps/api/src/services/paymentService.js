<content>
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (payload) => {
  // Validate input is already done in controller
  // This function now assumes valid input
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency,
      // Add other required Stripe parameters as needed
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw new Error('Failed to create payment intent');
  }
};

module.exports = {
  createPaymentIntent
};
</content>