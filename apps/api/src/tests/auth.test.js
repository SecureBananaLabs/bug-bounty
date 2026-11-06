import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function jsonPost(port, path, body) {
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function startApp() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { server, port };
}

test("POST /api/auth/register → 201 with valid payload", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, `/api/auth/register`, {
    email: "alice@test.com",
    password: "secret12345",
    role: "client",
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data.token);
  assert.equal(body.data.email, "alice@test.com");
});

test("POST /api/auth/login returns 200 with valid credentials after registration", async () => {
  const { port } = await startApp();

  // register first
  await jsonPost(port, `/api/auth/register`, {
    email: "bob@test.com",
    password: "bobsecret99",
    role: "freelancer",
  });

  const res = await jsonPost(port, `/api/auth/login`, {
    email: "bob@test.com",
    password: "bobsecret99",
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.token);
  assert.equal(body.data.email, "bob@test.com");
});

test("POST /api/auth/login returns 401 with wrong password", async () => {
  const { port } = await startApp();

  await jsonPost(port, `/api/auth/register`, {
    email: "carol@test.com",
    password: "rightpassword1",
    role: "client",
  });

  const res = await jsonPost(port, `/api/auth/login`, {
    email: "carol@test.com",
    password: "wrongpassword",
  });
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("Invalid email or password"));
});

test("POST /api/auth/login returns 401 for unregistered email", async () => {
  const { port } = await startApp();

  const res = await jsonPost(port, `/api/auth/login`, {
    email: "ghost@test.com",
    password: "anything123",
  });
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("Invalid email or password"));
});

test("POST /api/auth/login token sub matches the registered user id", async () => {
  const { port } = await startApp();

  const regRes = await jsonPost(port, `/api/auth/register`, {
    email: "dave@test.com",
    password: "davepwd11111",
    role: "client",
  });
  const regBody = await regRes.json();
  const registeredId = regBody.data.id;

  const loginRes = await jsonPost(port, `/api/auth/login`, {
    email: "dave@test.com",
    password: "davepwd11111",
  });
  const loginBody = await loginRes.json();

  // Decode JWT payload without verification
  const token = loginBody.data.token;
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf8")
  );

  assert.equal(payload.sub, registeredId);
  assert.equal(payload.role, "client");
});