import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role", () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    role: "admin"
  });
  assert.equal(result.success, false);
});

test("registerSchema accepts client role", () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    role: "client"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});

test("registerSchema accepts freelancer role", () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.role, "freelancer");
});

test("registerSchema defaults to client when role omitted", () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});
