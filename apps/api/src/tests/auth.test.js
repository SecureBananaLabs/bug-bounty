import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { server, port };
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/auth/register rejects missing fullName", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123"
    })
  });

  assert.equal(response.status, 422, "Should reject with 422 when fullName is absent");

  await stopServer(server);
});

test("POST /api/auth/register rejects empty fullName", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "",
      email: "user@example.com",
      password: "password123"
    })
  });

  assert.equal(response.status, 422, "Should reject with 422 when fullName is empty");

  await stopServer(server);
});

test("POST /api/auth/register includes fullName in response", async () => {
  const { server, port } = await startServer();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Alice Smith",
      email: "alice@example.com",
      password: "password123"
    })
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.fullName, "Alice Smith");

  await stopServer(server);
});
