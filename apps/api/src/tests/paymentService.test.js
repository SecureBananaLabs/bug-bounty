import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("payment intents include the initial provider status", async () => {
  const intent = await createPaymentIntent({
    amount: 5000,
    currency: "usd"
  });

  assert.match(intent.paymentId, /^pay_\d+$/);
  assert.equal(intent.amount, 5000);
  assert.equal(intent.currency, "usd");
  assert.equal(intent.provider, "stripe");
  assert.equal(intent.status, "requires_confirmation");
});

test("payment intents still default missing currency to usd", async () => {
  const intent = await createPaymentIntent({ amount: 2500 });

  assert.equal(intent.currency, "usd");
  assert.equal(intent.status, "requires_confirmation");
});
