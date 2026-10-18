import Stripe from "stripe";

let stripeClient;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY environment variable."
    );
  }

  stripeClient = new Stripe(secretKey);

  return stripeClient;
}

function validateAmount(amount) {
  if (
    amount === undefined
    || amount === null
    || amount === ""
  ) {
    throw new Error("amount is required.");
  }

  if (
    typeof amount !== "number"
    || Number.isNaN(amount)
  ) {
    throw new Error(
      "amount must be a number."
    );
  }

  if (!Number.isInteger(amount)) {
    throw new Error(
      "amount must be an integer."
    );
  }

  if (amount <= 0) {
    throw new Error(
      "amount must be greater than zero."
    );
  }
}

function resolveCurrency(currency) {
  if (
    currency === undefined
    || currency === null
  ) {
    return "usd";
  }

  if (
    typeof currency !== "string"
    || !/^[a-zA-Z]{3}$/.test(
      currency.trim()
    )
  ) {
    throw new Error(
      "currency must be a non-empty string."
    );
  }

  return currency.trim().toLowerCase();
}

export async function createPaymentIntent(
  payload
) {
  if (
    !payload
    || typeof payload !== "object"
    || Array.isArray(payload)
  ) {
    throw new Error(
      "payload is required."
    );
  }

  validateAmount(
    payload.amount
  );

  const currency = resolveCurrency(
    payload.currency
  );

  const stripe = getStripeClient();

  try {
    const paymentIntent = (
      await stripe.paymentIntents.create(
        {
          amount: payload.amount,
          currency,
        }
      )
    );

    return {
      clientSecret:
        paymentIntent.client_secret,
      paymentId:
        paymentIntent.id,
      amount:
        paymentIntent.amount,
      currency:
        paymentIntent.currency,
      provider:
        "stripe",
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Stripe payment intent creation failed."
    );
  }
}