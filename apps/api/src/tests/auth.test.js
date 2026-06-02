import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema accepts client role", () => {
  const result = registerSchema.parse({ email: "test@example.com", password: "password123", role: "client" });
  assert.equal(result.role, "client");
});

test("registerSchema accepts freelancer role", () => {
  const result = registerSchema.parse({ email: "test@example.com", password: "password123", role: "freelancer" });
  assert.equal(result.role, "freelancer");
});

test("registerSchema defaults to client role when not provided", () => {
  const result = registerSchema.parse({ email: "test@example.com", password: "password123" });
  assert.equal(result.role, "client");
});

test("registerSchema rejects admin role", () => {
  assert.throws(() => {
    registerSchema.parse({ email: "test@example.com", password: "password123", role: "admin" });
  }, /Invalid enum value/);
});

test("registerSchema rejects invalid role", () => {
  assert.throws(() => {
    registerSchema.parse({ email: "test@example.com", password: "password123", role: "superadmin" });
  }, /Invalid enum value/);
});

test("registerSchema rejects invalid email", () => {
  assert.throws(() => {
    registerSchema.parse({ email: "not-an-email", password: "password123" });
  });
});

test("registerSchema rejects short password", () => {
  assert.throws(() => {
    registerSchema.parse({ email: "test@example.com", password: "short" });
  });
});

