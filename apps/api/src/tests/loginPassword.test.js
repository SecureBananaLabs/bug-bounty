import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function post(port, path, body) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return { status: response.status, payload: await response.json() };
}

test("login issues a token for the registered password", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const registered = await post(port, "/api/auth/register", {
    email: "dev@example.com",
    password: "correct-horse",
    role: "freelancer"
  });

  assert.equal(registered.status, 201);
  assert.equal(registered.payload.data.email, "dev@example.com");

  const login = await post(port, "/api/auth/login", {
    email: "dev@example.com",
    password: "correct-horse"
  });

  assert.equal(login.status, 200);
  assert.equal(login.payload.success, true);
  assert.equal(typeof login.payload.data.token, "string");
  assert.equal(login.payload.data.email, "dev@example.com");

  await close(server);
});

test("login rejects a wrong password with 401", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  await post(port, "/api/auth/register", {
    email: "ops@example.com",
    password: "battery-staple"
  });

  const login = await post(port, "/api/auth/login", {
    email: "ops@example.com",
    password: "wrong-password"
  });

  assert.equal(login.status, 401);
  assert.equal(login.payload.success, false);
  assert.equal(login.payload.message, "Invalid credentials");

  await close(server);
});

test("login rejects an unknown email with 401", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const login = await post(port, "/api/auth/login", {
    email: "nobody@example.com",
    password: "correct-horse"
  });

  assert.equal(login.status, 401);
  assert.equal(login.payload.success, false);

  await close(server);
});
