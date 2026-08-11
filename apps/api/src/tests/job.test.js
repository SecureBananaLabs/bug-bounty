import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/jobs without authorization header fails with 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Connection": "close"
    },
    body: JSON.stringify({
      title: "Senior Node.js Engineer",
      description: "Build robust Express APIs and secure endpoints",
      budgetMin: 3000,
      budgetMax: 5000,
      categoryId: "cat_development"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs with invalid bearer token fails with 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid_token_here",
      "Connection": "close"
    },
    body: JSON.stringify({
      title: "Senior Node.js Engineer",
      description: "Build robust Express APIs and secure endpoints",
      budgetMin: 3000,
      budgetMax: 5000,
      categoryId: "cat_development"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid token");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs with a valid bearer token succeeds with 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Sign a valid token
  const token = signAccessToken({ sub: "usr_123", email: "test@example.com", role: "client" });

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Connection": "close"
    },
    body: JSON.stringify({
      title: "Senior Node.js Engineer",
      description: "Build robust Express APIs and secure endpoints",
      budgetMin: 3000,
      budgetMax: 5000,
      categoryId: "cat_development"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.title, "Senior Node.js Engineer");
  assert.equal(payload.data.status, "open");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
