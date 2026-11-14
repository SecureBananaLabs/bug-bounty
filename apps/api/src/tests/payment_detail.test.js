import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetPayments, listPayments } from "../services/paymentService.js";

test("Payment Detail By ID & Array Encapsulation", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    _resetPayments();
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

  await t.test("GET /api/payments/:id returns 404 when payment does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/payments/non_existent_pay`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Payment not found");
  });

  await t.test("POST /api/payments creates a payment and GET /api/payments/:id resolves it", async () => {
    const createRes = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 800,
        currency: "usd"
      })
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    const paymentId = createBody.data.paymentId;
    assert.ok(paymentId);
    assert.match(paymentId, /^pay_/);
    assert.equal(createBody.data.amount, 800);
    assert.equal(createBody.data.currency, "usd");
    assert.equal(createBody.data.provider, "stripe");

    // Resolve by ID
    const getRes = await fetch(`${baseUrl}/api/payments/${paymentId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.paymentId, paymentId);
    assert.equal(getBody.data.amount, 800);
    assert.equal(getBody.data.currency, "usd");
    assert.equal(getBody.data.status, "created");
  });

  await t.test("listPayments returns a defensive snapshot array", async () => {
    const createRes = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 1200,
        currency: "eur"
      })
    });
    assert.equal(createRes.status, 201);

    const snapshot = await listPayments();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listPayments();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
