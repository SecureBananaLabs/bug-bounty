import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/register prevents admin role self-assignment", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Attempting to self-assign admin role
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "attacker@example.com",
      password: "SuperSecretPassword123!",
      role: "admin"
    })
  });

  assert.equal(response.status, 400, "Registration with admin role should return 400 Bad Request");
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Validation failed");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/register allows valid client and freelancer registration", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const clientRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "client@example.com",
      password: "SuperSecretPassword123!",
      role: "client"
    })
  });

  assert.equal(clientRes.status, 201);
  const clientPayload = await clientRes.json();
  assert.equal(clientPayload.data.role, "client");

  const freelancerRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "freelancer@example.com",
      password: "SuperSecretPassword123!",
      role: "freelancer"
    })
  });

  assert.equal(freelancerRes.status, 201);
  const freelancerPayload = await freelancerRes.json();
  assert.equal(freelancerPayload.data.role, "freelancer");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
