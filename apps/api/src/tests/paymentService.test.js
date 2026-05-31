import assert from "node:assert/strict";
import { test } from "node:test";

import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults currency to USD", async () => {
  const intent = await createPaymentIntent({ amount: 1200 });

  assert.equal(intent.currency, "USD");
});

test("createPaymentIntent normalizes lowercase currency input", async () => {
  const intent = await createPaymentIntent({ amount: 1200, currency: "eur" });

  assert.equal(intent.currency, "EUR");
});
