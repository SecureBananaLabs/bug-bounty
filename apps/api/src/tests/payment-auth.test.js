import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/payments rejects unauthenticated requests with 401", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, currency: "usd" }),
  });

  assert.equal(response.status, 401);

  await closeServer(server);
});

test("POST /api/payments rejects requests with invalid token", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token-here",
    },
    body: JSON.stringify({ amount: 100, currency: "usd" }),
  });

  assert.equal(response.status, 401);

  await closeServer(server);
});
