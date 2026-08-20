import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePlatformFee,
  createPaymentIntent,
  setStripeClientForTesting
} from "../services/paymentService.js";

function createStripeMock() {
  const calls = [];

  return {
    calls,
    client: {
      paymentIntents: {
        async create(payload) {
          calls.push(payload);
          return {
            id: "pi_test_123",
            client_secret: "pi_test_123_secret_456",
            capture_method: payload.capture_method,
            status: "requires_payment_method"
          };
        }
      }
    }
  };
}

test.afterEach(() => {
  setStripeClientForTesting(undefined);
});

test("calculatePlatformFee rounds fees in the smallest currency unit", () => {
  assert.equal(calculatePlatformFee(12345, 10), 1235);
  assert.equal(calculatePlatformFee(999, 2.9), 29);
});

test("createPaymentIntent creates a manual-capture Stripe payment intent", async () => {
  const stripe = createStripeMock();
  setStripeClientForTesting(stripe.client);

  const result = await createPaymentIntent({
    amount: 25000,
    currency: "USD",
    jobId: "job_123",
    proposalId: "proposal_456",
    payerId: "user_789",
    description: "Escrow payment for job_123"
  });

  assert.equal(result.paymentId, "pi_test_123");
  assert.equal(result.clientSecret, "pi_test_123_secret_456");
  assert.equal(result.captureMethod, "manual");
  assert.equal(result.platformFeeAmount, 2500);
  assert.equal(result.netAmount, 22500);
});

test("createPaymentIntent sends Connect transfer data when a freelancer account is supplied", async () => {
  const stripe = createStripeMock();
  setStripeClientForTesting(stripe.client);

  await createPaymentIntent({
    amount: 10000,
    freelancerAccountId: "acct_freelancer"
  });

  assert.equal(stripe.calls[0].application_fee_amount, 1000);
  assert.deepEqual(stripe.calls[0].transfer_data, {
    destination: "acct_freelancer"
  });
});
