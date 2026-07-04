import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("registration duplicate validation rejection", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const email = `unique_${Date.now()}@example.com`;

  // First registration request should succeed
  const response1 = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test User",
      email: email,
      password: "password123",
      role: "client"
    })
  });
  assert.equal(response1.status, 201);

  // Second registration request with exact same email should fail with 409
  const response2 = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test User",
      email: email,
      password: "password123",
      role: "client"
    })
  });
  assert.equal(response2.status, 409);

  // Third registration request with case and extra space variations should also fail with 409
  const response3 = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test User",
      email: `  ${email.toUpperCase()}  `,
      password: "password123",
      role: "client"
    })
  });
  assert.equal(response3.status, 409);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
