import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { env } from "../config/env.js";

// Store original env value to restore after tests
const originalKey = env.stripeSecretKey;

describe("createPaymentIntent (unit — mocked Stripe)", () => {
  it("throws when amount is missing", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await assert.rejects(
      () => createPaymentIntent({}),
      { message: /Missing required field: amount/ }
    );
  });

  it("throws when amount is not a positive integer", async () => {
    const { createPaymentIntent } = await import("../services/paymentService.js");
    await assert.rejects(
      () => createPaymentIntent({ amount: -100 }),
      { message: /amount must be a positive integer/ }
    );
    await assert.rejects(
      () => createPaymentIntent({ amount: 0 }),
      { message: /amount must be a positive integer/ }
    );
    await assert.rejects(
      () => createPaymentIntent({ amount: 12.5 }),
      { message: /amount must be a positive integer/ }
    );
  });

  it("accepts valid amount with default currency USD", async () => {
    // Mock the Stripe SDK
    mock.module("stripe", () => {
      return {
        default: class MockStripe {
          paymentIntents = {
            create: mock.fn(async (params) => ({
              id: "pi_test_mock_123",
              client_secret: "pi_test_mock_123_secret_abc",
              amount: params.amount,
              currency: params.currency,
              status: "requires_confirmation",
            })),
          };
        },
      };
    });

    // Re-import after mocking
    const { createPaymentIntent } = await import("../services/paymentService.js");
    const result = await createPaymentIntent({ amount: 2999 });

    assert.equal(result.paymentId, "pi_test_mock_123");
    assert.equal(result.clientSecret, "pi_test_mock_123_secret_abc");
    assert.equal(result.amount, 2999);
    assert.equal(result.currency, "usd");
    assert.equal(result.provider, "stripe");
  });

  it("accepts custom currency code", async () => {
    mock.module("stripe", () => {
      return {
        default: class MockStripe {
          paymentIntents = {
            create: mock.fn(async (params) => ({
              id: "pi_test_mock_eur",
              client_secret: "pi_test_mock_eur_secret",
              amount: params.amount,
              currency: params.currency,
              status: "requires_confirmation",
            })),
          };
        },
      };
    });

    const { createPaymentIntent } = await import("../services/paymentService.js");
    const result = await createPaymentIntent({ amount: 1500, currency: "eur" });
    assert.equal(result.currency, "eur");
  });
});

describe("createPaymentIntent (integration — guarded)", { skip: !originalKey }, () => {
  it("creates a real test-mode PaymentIntent against Stripe API", async () => {
    env.stripeSecretKey = originalKey; // ensure key is set for this test
    const { createPaymentIntent } = await import("../services/paymentService.js");
    const result = await createPaymentIntent({ amount: 2000, currency: "usd" });
    assert.ok(result.paymentId.startsWith("pi_"), `Expected Stripe payment ID (pi_...) got ${result.paymentId}`);
    assert.ok(result.clientSecret, "clientSecret should be present");
    assert.equal(result.amount, 2000);
  });
});
