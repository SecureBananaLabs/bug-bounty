import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../validators/auth.js";
import { createApp } from "../app.js";

// Unit Tests: Register Schema
test("Validator: registerSchema accepts valid payload", () => {
  const validData = {
    email: "test@example.com",
    password: "securepassword123",
    role: "client"
  };

  const result = registerSchema.safeParse(validData);
  assert.equal(result.success, true);
});

test("Validator: registerSchema defaults role to client", () => {
  const validData = {
    email: "test@example.com",
    password: "securepassword123"
  };

  const result = registerSchema.safeParse(validData);
  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});

test("Validator: registerSchema rejects invalid email format", () => {
  const invalidData = {
    email: "not-an-email",
    password: "securepassword123"
  };

  const result = registerSchema.safeParse(invalidData);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "email");
});

test("Validator: registerSchema rejects password under 8 characters", () => {
  const invalidData = {
    email: "test@example.com",
    password: "short"
  };

  const result = registerSchema.safeParse(invalidData);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "password");
});

test("Validator: registerSchema rejects invalid roles", () => {
  const invalidData = {
    email: "test@example.com",
    password: "securepassword123",
    role: "superuser"
  };

  const result = registerSchema.safeParse(invalidData);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "role");
});

// Unit Tests: Login Schema
test("Validator: loginSchema accepts valid payload", () => {
  const validData = {
    email: "test@example.com",
    password: "securepassword123"
  };

  const result = loginSchema.safeParse(validData);
  assert.equal(result.success, true);
});

test("Validator: loginSchema rejects invalid email", () => {
  const invalidData = {
    email: "bademail",
    password: "securepassword123"
  };

  const result = loginSchema.safeParse(invalidData);
  assert.equal(result.success, false);
});

// Integration Tests
test("Integration: POST /api/auth/register rejects invalid payloads with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        email: "invalid-email",
        password: "short"
      })
    });

    assert.equal(response.status, 400);

    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.length >= 2); // Both email and password validation should fail
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("Integration: POST /api/auth/register accepts valid payload with 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "securepassword123",
        role: "freelancer"
      })
    });

    assert.equal(response.status, 201);

    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "test@example.com");
    assert.equal(payload.data.role, "freelancer");
    assert.ok(payload.data.token);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("Integration: POST /api/auth/login rejects invalid payloads with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "short" // < 8 characters
      })
    });

    assert.equal(response.status, 400);

    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("Integration: POST /api/auth/login accepts valid payload with 200", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connection": "close"
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "securepassword123"
      })
    });

    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "test@example.com");
    assert.ok(payload.data.token);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
