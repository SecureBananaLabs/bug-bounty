import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema should reject admin role", () => {
  const payload = { email: "hacker@evil.com", password: "password123", role: "admin" };
  assert.throws(
    () => registerSchema.parse(payload),
    /Invalid enum value/,
    "Expected ZodError when role=admin is provided"
  );
});

test("registerSchema should accept client role", () => {
  const payload = { email: "client@test.com", password: "password123", role: "client" };
  const result = registerSchema.parse(payload);
  assert.equal(result.role, "client");
});

test("registerSchema should accept freelancer role", () => {
  const payload = { email: "freelancer@test.com", password: "password123", role: "freelancer" };
  const result = registerSchema.parse(payload);
  assert.equal(result.role, "freelancer");
});

test("registerSchema should default to client when role omitted", () => {
  const payload = { email: "default@test.com", password: "password123" };
  const result = registerSchema.parse(payload);
  assert.equal(result.role, "client");
});
