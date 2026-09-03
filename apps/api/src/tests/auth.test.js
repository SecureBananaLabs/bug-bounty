import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { resetAuthUsersForTest } from "../services/authService.js";

async function withServer(fn) {
  resetAuthUsersForTest();
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("login rejects unregistered credentials", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email: "missing@example.com",
      password: "password123"
    });

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid credentials" });
  });
});

test("login rejects wrong password for a registered user", async () => {
  await withServer(async (baseUrl) => {
    await postJson(baseUrl, "/api/auth/register", {
      email: "client@example.com",
      password: "password123",
      role: "freelancer"
    });

    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password456"
    });

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid credentials" });
  });
});

test("successful login signs token for registered user id and role", async () => {
  await withServer(async (baseUrl) => {
    const { response: registerResponse, payload: registered } = await postJson(baseUrl, "/api/auth/register", {
      email: "Client@Example.com",
      password: "password123",
      role: "freelancer"
    });

    assert.equal(registerResponse.status, 201);

    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password123"
    });

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "client@example.com");

    const decoded = jwt.decode(payload.data.token);
    assert.equal(decoded.sub, registered.data.id);
    assert.equal(decoded.role, "freelancer");
  });
});

test("registration rejects duplicate emails", async () => {
  await withServer(async (baseUrl) => {
    const registration = {
      email: "duplicate@example.com",
      password: "password123",
      role: "client"
    };

    await postJson(baseUrl, "/api/auth/register", registration);
    const { response, payload } = await postJson(baseUrl, "/api/auth/register", registration);

    assert.equal(response.status, 409);
    assert.deepEqual(payload, { success: false, message: "Email already registered" });
  });
});