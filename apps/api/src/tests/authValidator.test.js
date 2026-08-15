import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema accepts public signup roles", () => {
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

  assert.equal(client.role, "client");
  assert.equal(freelancer.role, "freelancer");
});

test("registerSchema defaults omitted role to client", () => {
  const parsed = registerSchema.parse({
    email: "new-user@example.com",
    password: "password123"
  });

  assert.equal(parsed.role, "client");
});

test("registerSchema rejects admin self-assignment", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
  }, /Invalid enum value/);
});
