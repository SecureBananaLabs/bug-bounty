import test from "node:test";
import assert from "node:assert/strict";

import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent defaults missing currency to uppercase USD", async () => {
  const intent = await createPaymentIntent({ amount: 500 });

  assert.equal(intent.currency, "USD");
});

test("createPaymentIntent preserves explicit currency", async () => {
  const intent = await createPaymentIntent({ amount: 500, currency: "eur" });

  assert.equal(intent.currency, "eur");
});
