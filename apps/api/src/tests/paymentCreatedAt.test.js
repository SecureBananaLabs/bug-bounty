import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent } from "../services/paymentService.js";

test("createPaymentIntent includes a server-owned createdAt timestamp", async () => {
  const intent = await createPaymentIntent({ amount: 1000, currency: "usd" });

  assert.match(intent.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(!Number.isNaN(Date.parse(intent.createdAt)));
});

test("createPaymentIntent ignores caller-provided createdAt", async () => {
  const intent = await createPaymentIntent({
    amount: 1000,
    currency: "usd",
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  assert.notEqual(intent.createdAt, "2000-01-01T00:00:00.000Z");
  assert.match(intent.createdAt, /^\d{4}-\d{2}-\d{2}T/);
});
