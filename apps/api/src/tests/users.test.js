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

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function url(server, path) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}${path}`;
}

async function postJSON(server, path, body) {
  const response = await fetch(url(server, path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { response, payload };
}

test("POST /api/users rejects payloads with missing email", async () => {
  const app = createApp();
  const server = await startServer(app);

  const { response, payload } = await postJSON(server, "/api/users", {
    fullName: "No Email",
  });

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.error, "Validation error");
  assert.ok(payload.details.some((d) => d.path === "email"));

  await stopServer(server);
});

test("POST /api/users rejects admin role assignment", async () => {
  const app = createApp();
  const server = await startServer(app);

  const { response, payload } = await postJSON(server, "/api/users", {
    email: "admin@evil.com",
    fullName: "Hacker",
    role: "admin",
  });

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.error, "Validation error");
  assert.ok(payload.details.some((d) => d.path === "role"));

  await stopServer(server);
});

test("POST /api/users accepts valid client payload", async () => {
  const app = createApp();
  const server = await startServer(app);

  const { response, payload } = await postJSON(server, "/api/users", {
    email: "client@example.com",
    fullName: "Valid Client",
    role: "client",
  });

  assert.equal(response.status, 201);
  assert.ok(payload.success);
  const user = payload.data;
  assert.equal(user.email, "client@example.com");
  assert.equal(user.role, "client");
  assert.ok(user.id);

  await stopServer(server);
});

test("POST /api/users accepts valid payload with default role", async () => {
  const app = createApp();
  const server = await startServer(app);

  const { response, payload } = await postJSON(server, "/api/users", {
    email: "freelancer@example.com",
    fullName: "Default Role",
  });

  assert.equal(response.status, 201);
  assert.ok(payload.success);
  const user = payload.data;
  assert.equal(user.email, "freelancer@example.com");
  assert.equal(user.role, "client");
  assert.ok(user.id);

  await stopServer(server);
});

test("POST /api/users rejects freelancer with empty email", async () => {
  const app = createApp();
  const server = await startServer(app);

  const { response, payload } = await postJSON(server, "/api/users", {
    fullName: "Bad Freelancer",
    role: "freelancer",
  });

  assert.equal(response.status, 400);
  assert.equal(payload.error, "Validation error");
  assert.ok(payload.details.some((d) => d.path === "email"));

  await stopServer(server);
});