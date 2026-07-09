import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects 'admin' role during registration", () => {
  assert.throws(
    () => registerSchema.parse({
      email: "admin@test.com",
      password: "password123",
      role: "admin"
    }),
    /Invalid enum value/,
    "Should reject admin role assignment"
  );
});

test("registerSchema defaults to 'client' when no role is provided", () => {
  const result = registerSchema.parse({
    email: "user@test.com",
    password: "password123"
  });
  assert.equal(result.role, "client");
});

test("registerSchema accepts valid roles", () => {
  const client = registerSchema.parse({
    email: "client@test.com",
    password: "password123",
    role: "client"
  });
  assert.equal(client.role, "client");

  const freelancer = registerSchema.parse({
    email: "freelancer@test.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(freelancer.role, "freelancer");
});
