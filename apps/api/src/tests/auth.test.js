import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("registerSchema requires fullName", () => {
  assert.throws(() =>
    registerSchema.parse({
      email: "new-client@example.com",
      password: "password123"
    })
  );

  assert.throws(() =>
    registerSchema.parse({
      fullName: "   ",
      email: "new-client@example.com",
      password: "password123"
    })
  );
});

test("registerSchema trims and keeps fullName", () => {
  const payload = registerSchema.parse({
    fullName: "  Ada Lovelace  ",
    email: "ada@example.com",
    password: "password123"
  });

  assert.equal(payload.fullName, "Ada Lovelace");
  assert.equal(payload.role, "client");
});

test("registerUser returns fullName and a matching user id", async () => {
  const result = await registerUser({
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    password: "password123",
    role: "client"
  });

  assert.equal(result.fullName, "Ada Lovelace");
  assert.equal(result.email, "ada@example.com");
  assert.equal(result.role, "client");
  assert.match(result.id, /^usr_/);
  assert.equal(typeof result.token, "string");
});

test("POST /api/auth/register rejects requests without fullName", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "new-client@example.com",
        password: "password123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.equal(payload.issues[0].path[0], "fullName");
  });
});

test("POST /api/auth/register includes fullName in the created user payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.fullName, "Ada Lovelace");
    assert.equal(payload.data.email, "ada@example.com");
    assert.equal(payload.data.role, "client");
    assert.match(payload.data.id, /^usr_/);
    assert.equal(typeof payload.data.token, "string");
  });
});
