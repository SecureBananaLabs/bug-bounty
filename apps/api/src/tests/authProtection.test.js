import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const { once } = await import("node:events");

test("POST /api/payments requires authentication", async () => {
  const app = createApp();
  const server = app.listen(0);
  await once(server, "listening");
  const { port } = server.address();
  const url = "http://127.0.0.1:" + port + "/api/payments";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, currency: "usd" })
  });
  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.message, "Unauthorized");
  server.close();
});
