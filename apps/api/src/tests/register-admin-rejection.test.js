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

test("POST /api/register rejects admin role", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "attacker@evil.com",
      password: "password123",
      role: "admin",
    }),
  });

  assert.equal(response.status, 400);

  await closeServer(server);
});

test("POST /api/register accepts client role", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123",
      role: "client",
    }),
  });

  assert.equal(response.status, 201);

  await closeServer(server);
});

test("POST /api/register accepts freelancer role", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer",
    }),
  });

  assert.equal(response.status, 201);

  await closeServer(server);
});
