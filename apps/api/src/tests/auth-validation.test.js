import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects public admin role assignment", () => {
  const result = registerSchema.safeParse({
    email: "owner@example.com",
    password: "password123",
    role: "admin"
  });

  assert.equal(result.success, false);
});

test("registerSchema preserves client default role", () => {
  const result = registerSchema.parse({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(result.role, "client");
});
