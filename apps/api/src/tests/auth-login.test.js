import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { resetAuthUsersForTests } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/login rejects unknown users", async () => {
  resetAuthUsersForTests();
  const server = await startServer();

  try {
    const response = await postJson(server.baseUrl, "/api/auth/login", {
      email: "unknown@example.com",
      password: "password123"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid email or password"
    });
  } finally {
    await server.close();
  }
});

test("POST /api/auth/login rejects wrong passwords for registered users", async () => {
  resetAuthUsersForTests();
  const server = await startServer();

  try {
    await postJson(server.baseUrl, "/api/auth/register", {
      email: "writer@example.com",
      password: "correct-password",
      role: "freelancer"
    });

    const response = await postJson(server.baseUrl, "/api/auth/login", {
      email: "writer@example.com",
      password: "wrong-password"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid email or password"
    });
  } finally {
    await server.close();
  }
});

test("POST /api/auth/login signs tokens for the registered user subject and role", async () => {
  resetAuthUsersForTests();
  const server = await startServer();

  try {
    const registerResponse = await postJson(server.baseUrl, "/api/auth/register", {
      email: "Client@Example.com",
      password: "password123",
      role: "client"
    });
    const registered = await registerResponse.json();

    assert.equal(registerResponse.status, 201);

    const loginResponse = await postJson(server.baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "password123"
    });
    const loggedIn = await loginResponse.json();
    const tokenPayload = verifyAccessToken(loggedIn.data.token);

    assert.equal(loginResponse.status, 200);
    assert.equal(loggedIn.data.email, "client@example.com");
    assert.equal(tokenPayload.sub, registered.data.id);
    assert.equal(tokenPayload.role, "client");
  } finally {
    await server.close();
  }
});
