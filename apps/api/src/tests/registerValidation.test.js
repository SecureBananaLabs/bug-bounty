import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema accepts valid client role", () => {
  const result = registerSchema.parse({
    email: "test@example.com",
    password: "password123",
    role: "client"
  });
  assert.equal(result.role, "client");
});

test("registerSchema accepts valid freelancer role", () => {
  const result = registerSchema.parse({
    email: "test@example.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(result.role, "freelancer");
});

test("registerSchema defaults to client when role omitted", () => {
  const result = registerSchema.parse({
    email: "test@example.com",
    password: "password123"
  });
  assert.equal(result.role, "client");
});

test("registerSchema rejects admin role", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "attacker@evil.com",
      password: "password123",
      role: "admin"
    });
  });
});

test("registerSchema rejects invalid role", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "superadmin"
    });
  });
});

test("registerSchema rejects missing email", () => {
  assert.throws(() => {
    registerSchema.parse({
      password: "password123"
    });
  });
});

test("registerSchema rejects missing password", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "test@example.com"
    });
  });
});

test("registerSchema rejects short password", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "short"
    });
  });
});

test("registerSchema rejects invalid email", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "not-an-email",
      password: "password123"
    });
  });
});
