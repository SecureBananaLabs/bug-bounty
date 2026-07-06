import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema defaults new users to the client role", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(payload.role, "client");
});

test("registerSchema allows normal public registration roles", () => {
  const payload = registerSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(payload.role, "freelancer");
});

test("registerSchema rejects public admin self-assignment", () => {
  assert.throws(() =>
    registerSchema.parse({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    })
  );
});
