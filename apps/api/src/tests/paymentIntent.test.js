import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent falls back to a lowercase default currency", async () => {
  const intent = await createPaymentIntent({ amount: 40 });

  assert.equal(intent.currency, "usd");
  assert.equal(intent.amount, 40);
  assert.equal(intent.provider, "stripe");
});

test("createPaymentIntent trims and lowercases the supplied currency", async () => {
  const padded = await createPaymentIntent({ amount: 10, currency: "  USD  " });
  const upper = await createPaymentIntent({ amount: 10, currency: "GBP" });

  assert.equal(padded.currency, "usd");
  assert.equal(upper.currency, "gbp");
});

test("createPaymentIntent keeps an empty currency on the default", async () => {
  const blank = await createPaymentIntent({ amount: 10, currency: "   " });

  assert.equal(blank.currency, "usd");
});
