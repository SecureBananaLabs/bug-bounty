import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Payment Validation Suite", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("POST /api/payments rejects payload with missing amount", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: "usd"
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("POST /api/payments rejects non-positive or sub-minimum amounts", async () => {
    const zeroRes = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 0,
        currency: "usd"
      })
    });
    assert.equal(zeroRes.status, 400);

    const negRes = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: -50,
        currency: "usd"
      })
    });
    assert.equal(negRes.status, 400);

    const subMinRes = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 0.20,
        currency: "usd"
      })
    });
    assert.equal(subMinRes.status, 400);
  });

  await t.test("POST /api/payments rejects invalid currency code", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 100,
        currency: "US"
      })
    });

    assert.equal(res.status, 400);
  });

  await t.test("POST /api/payments accepts valid payment intent and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 250.50,
        currency: "usd"
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.amount, 250.50);
    assert.equal(body.data.currency, "usd");
    assert.equal(body.data.provider, "stripe");
    assert.match(body.data.paymentId, /^pay_/);
  });
});
