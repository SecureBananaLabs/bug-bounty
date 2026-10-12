const { createPaymentIntent } = require("../src/payment/paymentService");
const Stripe = require("stripe");

jest.mock("stripe");

describe("createPaymentIntent", () => {
  let mockStripe;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
    mockStripe = Stripe.mocked;
  });

  test("creates a PaymentIntent with correct arguments", async () => {
    const mockPaymentIntent = {
      id: "pi_123",
      client_secret: "secret_456",
    };
    mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

    const result = await createPaymentIntent({ amount: 1000, currency: "usd" });

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 1000,
      currency: "usd",
    });
    expect(result).toEqual({
      clientSecret: "secret_456",
      paymentId: "pi_123",
    });
  });

  test("defaults currency to usd when not provided", async () => {
    const mockPaymentIntent = {
      id: "pi_123",
      client_secret: "secret_456",
    };
    mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

    await createPaymentIntent({ amount: 500 });

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 500,
      currency: "usd",
    });
  });

  test("throws when amount is missing", async () => {
    await expect(createPaymentIntent({})).rejects.toThrow(
      "payload.amount is required"
    );
  });

  test("throws when amount is not a positive integer", async () => {
    await expect(createPaymentIntent({ amount: -10 })).rejects.toThrow(
      "payload.amount must be a positive integer"
    );
    await expect(createPaymentIntent({ amount: 10.5 })).rejects.toThrow(
      "payload.amount must be a positive integer"
    );
  });

  test("preserves Stripe error message on API errors", async () => {
    const stripeError = new Error("Card declined");
    stripeError.type = "StripeCardError";
    mockStripe.paymentIntents.create.mockRejectedValue(stripeError);

    await expect(createPaymentIntent({ amount: 100 })).rejects.toThrow(
      "Card declined"
    );
  });

  test("includes metadata when provided", async () => {
    const mockPaymentIntent = {
      id: "pi_123",
      client_secret: "secret_456",
    };
    mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

    await createPaymentIntent({
      amount: 2000,
      currency: "eur",
      metadata: { orderId: "ord_999" },
    });

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 2000,
      currency: "eur",
      metadata: { orderId: "ord_999" },
    });
  });
});
