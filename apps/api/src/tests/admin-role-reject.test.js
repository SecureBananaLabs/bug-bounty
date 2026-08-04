import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role", () => {
  const result = registerSchema.safeParse({
    email: "admin@example.com",
    password: "password123",
    role: "admin"
  });
  assert.equal(result.success, false);
});

test("registerSchema accepts client role", () => {
  const result = registerSchema.safeParse({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  assert.equal(result.success, true);
});

test("registerSchema accepts freelancer role", () => {
  const result = registerSchema.safeParse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(result.success, true);
});

test("registerSchema defaults to client when role omitted", () => {
  const result = registerSchema.safeParse({
    email: "new@example.com",
    password: "password123"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});