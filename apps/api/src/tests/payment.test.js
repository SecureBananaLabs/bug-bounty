import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, _setStripeClient } from "../services/paymentService.js";

// --- Inject mock Stripe client before any tests run ---

const mockCreate = mock.fn(async ({ amount, currency }) => ({
  id: "pi_test_mock_123",
  client_secret: "pi_test_mock_123_secret_abc",
  amount,
  currency,
}));

_setStripeClient({ paymentIntents: { create: mockCreate } });

function resetMock() {
  mockCreate.mock.resetCalls();
}

// --- Unit tests ---

test("returns clientSecret and paymentId from Stripe", async () => {
  resetMock();
  const result = await createPaymentIntent({ amount: 1000, currency: "usd" });
  assert.equal(result.clientSecret, "pi_test_mock_123_secret_abc");
  assert.equal(result.paymentId, "pi_test_mock_123");
});

test("passes correct amount and currency to stripe.paymentIntents.create", async () => {
  resetMock();
  await createPaymentIntent({ amount: 2500, currency: "eur" });
  assert.equal(mockCreate.mock.calls.length, 1);
  const [args] = mockCreate.mock.calls[0].arguments;
  assert.equal(args.amount, 2500);
  assert.equal(args.currency, "eur");
});

test("defaults currency to usd when omitted", async () => {
  resetMock();
  await createPaymentIntent({ amount: 500 });
  const [args] = mockCreate.mock.calls[0].arguments;
  assert.equal(args.currency, "usd");
});

test("throws 400 error when amount is missing", async () => {
  await assert.rejects(
    () => createPaymentIntent({ currency: "usd" }),
    (err) => {
      assert.equal(err.message, "amount is required");
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test("throws 400 error when amount is zero", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }),
    (err) => {
      assert.match(err.message, /positive integer/);
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test("throws 400 error when amount is negative", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: -500 }),
    (err) => {
      assert.match(err.message, /positive integer/);
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test("throws 400 error when amount is a float", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 9.99 }),
    (err) => {
      assert.match(err.message, /positive integer/);
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test("propagates Stripe API errors with original message", async () => {
  resetMock();
  mockCreate.mock.mockImplementationOnce(async () => {
    const err = new Error("Your card was declined.");
    err.type = "StripeCardError";
    throw err;
  });
  await assert.rejects(
    () => createPaymentIntent({ amount: 1000 }),
    { message: "Your card was declined." }
  );
});

// --- Integration smoke test (environment-gated) ---

test(
  "integration: creates real PaymentIntent in Stripe test mode",
  { skip: !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") },
  async () => {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({ amount: 100, currency: "usd" });
    assert.ok(intent.id.startsWith("pi_"), "paymentIntent id should start with pi_");
    assert.ok(typeof intent.client_secret === "string", "client_secret should be a string");
  }
);
