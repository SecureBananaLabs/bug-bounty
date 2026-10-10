import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test("POST /api/payments without token returns 401 Unauthorized", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1500, currency: "usd" }),
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await server.close();
  }
});

test("POST /api/payments with invalid token returns 401 Invalid token", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid.payment.token",
      },
      body: JSON.stringify({ amount: 1500, currency: "usd" }),
    });
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  } finally {
    await server.close();
  }
});

test("POST /api/payments with valid bearer token passes auth and creates payment (201)", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ id: "user_client_1", email: "client@example.com" });
    const response = await fetch(`${server.baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: 1500, currency: "usd" }),
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
  } finally {
    await server.close();
  }
});
