import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema defaults public registrations to client role", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(payload.role, "client");
});

test("registerSchema accepts freelancer public registrations", () => {
  const payload = registerSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(payload.role, "freelancer");
});

test("registerSchema rejects admin role self-assignment", () => {
  const result = registerSchema.safeParse({
    email: "admin@example.com",
    password: "password123",
    role: "admin"
  });

  assert.equal(result.success, false);
});
