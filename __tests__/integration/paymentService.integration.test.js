const { createPaymentIntent } = require("../../src/payment/paymentService");

describe("createPaymentIntent - Integration", () => {
  beforeAll(() => {
    if (!process.env.STRIPE_INTEGRATION_TEST) {
      console.warn("Skipping integration test: STRIPE_INTEGRATION_TEST not set");
    }
  });

  test.skip("creates a real test-mode PaymentIntent against Stripe API", async () => {
    if (process.env.STRIPE_INTEGRATION_TEST !== "true") {
      return;
    }

    const result = await createPaymentIntent({
      amount: 1000,
      currency: "usd",
    });

    expect(result.paymentId).toMatch(/^pi_/);
    expect(result.clientSecret).toMatch(/^pi_/);
  });
});
