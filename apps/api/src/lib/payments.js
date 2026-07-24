const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// TODO: Add the actual implementation
// This is a placeholder to show the required changes

// The original stub implementation
// export async function createPaymentIntent(payload) {
//   return {
//     paymentId: `pay_${Date.now()}`,
//     amount: payload.amount,
//     currency: payload.currency ?? "us * 100
//   };
// }

// TODO: Replace the stub implementation with real Stripe SDK integration
// Return the client secret from the created PaymentIntent to the caller
// Handle Stripe API errors and surface them with meaningful error messages
// Ensure amount, currency, and any required metadata are validated before the API call
// }