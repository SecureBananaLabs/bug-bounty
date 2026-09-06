import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("register schema defaults role to client", () => {
  const result = registerSchema.parse({
    email: "user@example.com",
    password: "password123"
  });

  assert.equal(result.role, "client");
});

test("register schema accepts public roles and rejects admin", () => {
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
  assert.throws(() => {
    registerSchema.parse({
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
  }, /Invalid enum value/);
});
