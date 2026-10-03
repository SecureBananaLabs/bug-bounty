import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer() {
  return new Promise((resolve, reject) => {
    const app = createApp();
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/auth/register returns 400 for missing fullName", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "password123" })
    });
    assert.equal(response.status, 400);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/register returns 400 for empty fullName", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "password123", fullName: "" })
    });
    assert.equal(response.status, 400);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/register preserves fullName in response", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "password123", fullName: "John Doe" })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.data.fullName, "John Doe");
  } finally {
    await closeServer(server);
  }
});
