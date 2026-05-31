import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/register rejects role: admin", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: "attacker@gmail.com",
      password: "password123",
      role: "admin"
    })
  });

  // Zod parsing should fail on role: "admin"
  assert.notEqual(response.status, 201);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh passes refresh token and identifies user", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Register as freelancer
  const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: "freelancer@gmail.com",
      password: "password123",
      role: "freelancer"
    })
  });
  
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  const token = regData.data.token;
  
  // Refresh token
  const refRes = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  assert.equal(refRes.status, 200);
  const refData = await refRes.json();
  
  // Verify that the new token preserves the role: freelancer
  const decodedPayload = JSON.parse(Buffer.from(refData.data.token.split('.')[1], 'base64').toString());
  assert.equal(decodedPayload.role, "freelancer");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
