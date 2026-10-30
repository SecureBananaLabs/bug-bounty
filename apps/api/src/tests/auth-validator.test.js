import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role assignment", () => {
  const result = registerSchema.safeParse({
    email: "admin@example.com",
    password: "password123",
    role: "admin"
  });

  assert.equal(result.success, false);
});

test("registerSchema still allows client and freelancer roles", () => {
  const client = registerSchema.safeParse({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  const freelancer = registerSchema.safeParse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(client.success, true);
  assert.equal(freelancer.success, true);
});
