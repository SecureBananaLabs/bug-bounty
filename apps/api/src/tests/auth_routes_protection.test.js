import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/payments rejects unauthenticated requests with 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Connection": "close" },
    body: JSON.stringify({ amount: 1000 })
  });
  const data = await res.json();

  assert.equal(res.status, 401);
  assert.equal(data.success, false);
  assert.equal(data.message, "Unauthorized");

  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/notifications rejects unauthenticated requests with 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    headers: { "Connection": "close" }
  });
  const data = await res.json();

  assert.equal(res.status, 401);
  assert.equal(data.success, false);
  assert.equal(data.message, "Unauthorized");

  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});
