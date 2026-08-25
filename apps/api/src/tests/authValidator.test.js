import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role self-assignment", () => {
  const result = registerSchema.safeParse({
    email: "attacker@example.com",
    password: "correct-horse-battery-staple",
    role: "admin"
  });

  assert.equal(result.success, false);
});

test("registerSchema still accepts public registration roles", () => {
  for (const role of ["client", "freelancer"]) {
    const result = registerSchema.safeParse({
      email: `${role}@example.com`,
      password: "correct-horse-battery-staple",
      role
    });

    assert.equal(result.success, true);
    assert.equal(result.data.role, role);
  }
});

test("registerSchema defaults omitted role to client", () => {
  const result = registerSchema.safeParse({
    email: "new-client@example.com",
    password: "correct-horse-battery-staple"
  });

  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});
