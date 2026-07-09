import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";
import { createApp } from "../app.js";

test("Registration with fullName validation tests", async (t) => {
  await t.test("registerSchema should require non-empty fullName", () => {
    // Missing fullName
    const result1 = registerSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      role: "client"
    });
    assert.equal(result1.success, false);
    
    // Empty fullName
    const result2 = registerSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      fullName: "",
      role: "client"
    });
    assert.equal(result2.success, false);

    // Valid fullName
    const result3 = registerSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      fullName: "John Doe",
      role: "client"
    });
    assert.equal(result3.success, true);
    assert.equal(result3.data.fullName, "John Doe");
  });

  await t.test("registerUser service should carry fullName in the returned payload", async () => {
    const payload = {
      email: "test@example.com",
      password: "password123",
      fullName: "Alice Smith",
      role: "freelancer"
    };
    const result = await registerUser(payload);
    assert.equal(result.fullName, "Alice Smith");
    assert.ok(result.id);
    assert.ok(result.token);
  });

  await t.test("POST /api/auth/register E2E integration test", async () => {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/auth/register`;

    // 1. Request missing fullName
    const failResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "fail@example.com",
        password: "password123",
        role: "client"
      })
    });
    // It should be rejected (either 400 or 500 depending on middleware, but definitely not 201)
    assert.notEqual(failResponse.status, 201);

    // 2. Request with valid fullName
    const successResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "success@example.com",
        password: "password123",
        fullName: "Jane Doe",
        role: "client"
      })
    });
    
    assert.equal(successResponse.status, 201);
    const payload = await successResponse.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.fullName, "Jane Doe");

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
});
