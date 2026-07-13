import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser rejects duplicate email (case-insensitive)", async () => {
  const payload1 = { email: "test@example.com", password: "password123", role: "client" };
  const result1 = await registerUser(payload1);
  assert.equal(result1.email, "test@example.com");
  
  // Same email lowercase should be rejected
  const payload2 = { email: "TEST@EXAMPLE.COM", password: "password123", role: "freelancer" };
  try {
    await registerUser(payload2);
    assert.fail("Should have thrown 409");
  } catch (err) {
    assert.equal(err.statusCode, 409);
    assert.equal(err.message, "Email already registered");
  }
});

test("registerUser accepts different emails", async () => {
  const payload1 = { email: "unique1@test.com", password: "pass", role: "client" };
  const result1 = await registerUser(payload1);
  assert.equal(result1.email, "unique1@test.com");
  
  const payload2 = { email: "unique2@test.com", password: "pass", role: "freelancer" };
  const result2 = await registerUser(payload2);
  assert.equal(result2.email, "unique2@test.com");
});
