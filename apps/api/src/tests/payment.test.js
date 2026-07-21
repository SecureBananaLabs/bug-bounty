import test from "node:test";
import assert from "node:assert/strict";
import { createPayment } from "../controllers/paymentController.js";

function mockRes() {
  const r = { statusCode: 0, body: null };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (d) => { r.body = d; return r; };
  return r;
}

test("rejects missing amount", () => {
  const req = { body: {} };
  const res = mockRes();
  createPayment(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.ok(res.body.message.includes("amount"));
});

test("rejects negative amount", () => {
  const req = { body: { amount: -10 } };
  const res = mockRes();
  createPayment(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes("positive"));
});

test("rejects string amount", () => {
  const req = { body: { amount: "ten" } };
  const res = mockRes();
  createPayment(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes("number"));
});

test("rejects unsupported currency", () => {
  const req = { body: { amount: 10, currency: "btc" } };
  const res = mockRes();
  createPayment(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes("currency"));
});

test("accepts valid amount with default currency", async () => {
  const req = { body: { amount: 50 } };
  const res = mockRes();
  await createPayment(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.currency, "usd");
  assert.equal(res.body.data.amount, 50);
});

test("accepts valid amount with explicit usd currency", async () => {
  const req = { body: { amount: 25.5, currency: "usd" } };
  const res = mockRes();
  await createPayment(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.amount, 25.5);
});

test("rejects zero amount", () => {
  const req = { body: { amount: 0 } };
  const res = mockRes();
  createPayment(req, res);
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes("positive"));
});

test("rejects Infinity amount", () => {
  const req = { body: { amount: Infinity } };
  const res = mockRes();
  createPayment(req, res);
  assert.equal(res.statusCode, 400);
});
