import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

test("POST /api/auth/register rejects admin role", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "securepass123",
      role: "admin",
    }),
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false, "Should return success: false for admin role");
  assert.ok(payload.message, "Should return an error message");

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/register accepts client role", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "client@example.com",
      password: "securepass123",
      role: "client",
    }),
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.data.role, "client");

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/register accepts freelancer role", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "freelancer@example.com",
      password: "securepass123",
      role: "freelancer",
    }),
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.data.role, "freelancer");

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/register token subject matches returned user id", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.com",
      password: "securepass123",
      role: "client",
    }),
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  const userId = payload.data.id;
  const token = payload.data.token;

  // Decode the JWT and verify the subject matches the returned id
  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.sub, userId, "Token subject must match returned user id");

  await new Promise((resolve) => server.close(resolve));
});
