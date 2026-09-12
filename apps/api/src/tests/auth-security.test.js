import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

test("registerSchema rejects admin role", () => {
  const result = registerSchema.safeParse({
    email: "attacker@evil.com",
    password: "password123",
    role: "admin"
  });
  assert.equal(result.success, false, "admin role should be rejected by schema");
});

test("registerSchema accepts client role", () => {
  const result = registerSchema.safeParse({
    email: "user@test.com",
    password: "password123",
    role: "client"
  });
  assert.equal(result.success, true);
});

test("registerSchema accepts freelancer role", () => {
  const result = registerSchema.safeParse({
    email: "freelancer@test.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(result.success, true);
});

test("registerUser downgrades admin role to client", async () => {
  const result = await registerUser({
    email: "attacker@evil.com",
    password: "password123",
    role: "admin"
  });
  assert.equal(result.role, "client", "admin role should be downgraded to client");
});
