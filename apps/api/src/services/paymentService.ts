import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Use appropriate Stripe API version
  typescript: true,
});

export async function createPaymentIntent(payload) {
  // Validate payload.amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer (in smallest currency unit, e.g. cents)');
  }

  const amount = payload.amount;
  const currency = payload.currency || 'usd';
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payload.amount,
      currency: payload.currency ?? "usd",
      provider: "stripe"
    };
  } catch (error) {
    // Re-throw Stripe errors with original messages
    if (error.type && error.message) {
      throw new Error(`Stripe Error: ${error.message}`);
    }
    throw error;
  }
}

// Mock the original function for now
export async function createPaymentIntentOld(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}
  
export async function createPaymentIntentNew(payload) {
  // Validate payload.amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer (in smallest currency unit, e.g. cents)');
  }

  const amount = payload.amount;
  const currency = payload.currency || 'usd';
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: currency,
  });
  
  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: amount,
    currency: currency,
    provider: "stripe"
  };
}

// Actual implementation
export async function createPaymentIntent(payload) {
  // Validate payload
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer (in smallest currency unit, e.g. cents)');
  }

  const amount = payload.amount;
  const currency = payload.currency || 'usd';
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    // Handle and re-throw meaningful errors
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Payment Error: ${error.message}`);
    }
    throw error;
  }
}

// Fallback implementation to maintain the original function behavior during transition
export async function createPaymentIntentFallback(payload) {
  // TODO: integrate Stripe SDK and return client secret.
  return {
    paymentId: `pay_${Date.now()}`,
    amount: payload.amount,
    currency: payload.currency ?? "usd",
    provider: "stripe"
  };
}

// New implementation
export async function createPaymentIntent(payload) {
  // Validate payload.amount
  if (payload.amount === undefined || payload.amount === null) {
    throw new Error('Amount is required');
  }
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    throw new Error('Amount must be a positive integer (in smallest currency unit, e.g. cents)');
  }

  const amount = payload.amount;
  const currency = payload.currency || 'usd';
  
 // Initialize Stripe with your secret key. You can use the
  // "typescript" flag to conditionally use NodeTS support
  const stripe = Stripe(process.env.STRIEPE_SECRET_KEY);
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
    });
    
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency,
      provider: "stripe"
    };
  } catch (error) {
    if (error.type) {
      throw new Error(`Stripe Error: ${error.message}`);
    }
    throw error;
  }
}