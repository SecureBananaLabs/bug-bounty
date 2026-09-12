import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function postJson(port, path, data) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  return { status: res.status, body };
}

test("POST /api/users accepts valid payload", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { name: "John Doe", email: "john@example.com", password: "password123" };
  const { status, body } = await postJson(port, "/api/users", payload);
  assert.equal(status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.name, "John Doe");
  assert.equal(body.data.email, "john@example.com");
  assert.equal(body.data.password, "password123");
  assert.ok(body.data.id);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/users rejects missing fields", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const { status, body } = await postJson(port, "/api/users", {});
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/users rejects invalid email", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { name: "John", email: "not-an-email", password: "password123" };
  const { status, body } = await postJson(port, "/api/users", payload);
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/users rejects short password", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { name: "John", email: "john@example.com", password: "short" };
  const { status, body } = await postJson(port, "/api/users", payload);
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/users rejects extra fields", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { name: "John", email: "john@example.com", password: "password123", role: "admin" };
  const { status, body } = await postJson(port, "/api/users", payload);
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/users rejects system fields", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const payload = { name: "John", email: "john@example.com", password: "password123", id: "fake_id", createdAt: "2026-01-01" };
  const { status, body } = await postJson(port, "/api/users", payload);
  assert.equal(status, 400);
  assert.equal(body.success, false);
  await new Promise((resolve) => server.close(resolve));
});
