import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role for public signup", () => {
  const result = registerSchema.safeParse({
    email: "admin@example.com",
    password: "password123",
    role: "admin"
  });

  assert.equal(result.success, false);
});

test("registerSchema accepts public roles", () => {
  assert.equal(
    registerSchema.safeParse({
      email: "client@example.com",
      password: "password123",
      role: "client"
    }).success,
    true
  );
  assert.equal(
    registerSchema.safeParse({
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    }).success,
    true
  );
});

test("registerSchema defaults public signup to client", () => {
  const result = registerSchema.safeParse({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});
