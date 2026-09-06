import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("public registerSchema validates user roles and disallows admin self-assignment", () => {
  // 1. Omitted role defaults to 'client'
  const defaultRole = registerSchema.safeParse({
    email: "client@example.com",
    password: "securePassword123"
  });
  assert.equal(defaultRole.success, true);
  assert.equal(defaultRole.data.role, "client");

  // 2. Explicit 'client' is accepted
  const explicitClient = registerSchema.safeParse({
    email: "client2@example.com",
    password: "securePassword123",
    role: "client"
  });
  assert.equal(explicitClient.success, true);
  assert.equal(explicitClient.data.role, "client");

  // 3. Explicit 'freelancer' is accepted
  const explicitFreelancer = registerSchema.safeParse({
    email: "freelancer@example.com",
    password: "securePassword123",
    role: "freelancer"
  });
  assert.equal(explicitFreelancer.success, true);
  assert.equal(explicitFreelancer.data.role, "freelancer");

  // 4. 'admin' role is strictly rejected
  const adminAttempt = registerSchema.safeParse({
    email: "attacker@example.com",
    password: "securePassword123",
    role: "admin"
  });
  assert.equal(adminAttempt.success, false);
  assert.equal(adminAttempt.error.issues[0].path[0], "role");
});
