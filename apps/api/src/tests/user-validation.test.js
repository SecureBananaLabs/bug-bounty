import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/users validates input", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const validResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@example.com", role: "client" })
  });
  const validPayload = await validResponse.json();

  assert.equal(validResponse.status, 201);
  assert.equal(validPayload.success, true);
  assert.equal(validPayload.data.email, "demo@example.com");
  assert.equal(validPayload.data.role, "client");

  const invalidResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "client" })
  });
  const invalidPayload = await invalidResponse.json();

  assert.equal(invalidResponse.status, 500);
  assert.equal(invalidPayload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
