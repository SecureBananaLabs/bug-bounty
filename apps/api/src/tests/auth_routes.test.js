import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Authentication middleware enforcement on payments and proposals", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    return new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const validToken = signAccessToken({ id: "usr_123", email: "test@example.com" });

  await t.test("GET /api/proposals returns 401 Unauthorized when unauthenticated", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Unauthorized/i);
  });

  await t.test("POST /api/proposals returns 401 Unauthorized when unauthenticated", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Proposal" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Unauthorized/i);
  });

  await t.test("POST /api/payments returns 401 Unauthorized when unauthenticated", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000 })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Unauthorized/i);
  });

  await t.test("GET /api/proposals returns 200 OK when authenticated with a valid token", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      headers: {
        "Authorization": `Bearer ${validToken}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });

  await t.test("POST /api/proposals returns 201 Created when authenticated with a valid token", async () => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({ title: "New Proposal", amount: 1000 })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
  });

  await t.test("POST /api/payments returns 201 Created when authenticated with a valid token", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({ amount: 1000 })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.ok(payload.data.paymentId);
  });
});
