import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role", () => {
  const result = registerSchema.safeParse({
    email: "hacker@example.com",
    password: "password123",
    role: "admin"
  });
  assert.equal(result.success, false);
});

test("registerSchema allows client role", () => {
  const result = registerSchema.safeParse({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  assert.ok(result.success);
  assert.equal(result.data.role, "client");
});

test("registerSchema allows freelancer role", () => {
  const result = registerSchema.safeParse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  assert.ok(result.success);
  assert.equal(result.data.role, "freelancer");
});

test("registerSchema defaults to client when no role", () => {
  const result = registerSchema.safeParse({
    email: "default@example.com",
    password: "password123"
  });
  assert.ok(result.success);
  assert.equal(result.data.role, "client");
});