import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin self-assignment", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
  });
});

test("registerSchema still accepts public registration roles", () => {
  const client = registerSchema.parse({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  const freelancer = registerSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  const defaulted = registerSchema.parse({
    email: "default@example.com",
    password: "password123"
  });

  assert.equal(client.role, "client");
  assert.equal(freelancer.role, "freelancer");
  assert.equal(defaulted.role, "client");
});
