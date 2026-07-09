import test from "node:test";
import assert from "node:assert/strict";
import { createUserSchema } from "../validators/user.js";
import { createApp } from "../app.js";

test("Bug #1869: createUserSchema validation", () => {
  // Valid user creation payloads should not throw
  assert.doesNotThrow(() => {
    createUserSchema.parse({
      email: "test@example.com",
      name: "Alice",
      role: "client"
    });
  });

  assert.doesNotThrow(() => {
    createUserSchema.parse({
      email: "bob@example.com",
      name: "Bob",
      role: "freelancer"
    });
  });

  // Invalid email should throw
  assert.throws(() => {
    createUserSchema.parse({
      email: "not-an-email",
      name: "Alice",
      role: "client"
    });
  });

  // Name too short should throw
  assert.throws(() => {
    createUserSchema.parse({
      email: "test@example.com",
      name: "A",
      role: "client"
    });
  });

  // Invalid role should throw
  assert.throws(() => {
    createUserSchema.parse({
      email: "test@example.com",
      name: "Alice",
      role: "admin"
    });
  });
});

test("Bug #1869: POST /api/users validation via HTTP", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/users with valid payload succeeds", async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "success@example.com",
        name: "Test User",
        role: "freelancer"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "success@example.com");
    assert.equal(payload.data.name, "Test User");
    assert.equal(payload.data.role, "freelancer");
    assert.ok(payload.data.id);
  });

  await t.test("POST /api/users with invalid payload fails", async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bad-email",
        name: "",
        role: "admin"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
