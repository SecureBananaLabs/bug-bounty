import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role self-assignment", () => {
  const result = registerSchema.safeParse({
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });

  assert.equal(result.success, false);
});

test("registerSchema still accepts public roles", () => {
  for (const role of ["client", "freelancer"]) {
    const result = registerSchema.safeParse({
      email: `${role}@example.com`,
      password: "password123",
      role,
    });

    assert.equal(result.success, true);
    assert.equal(result.data.role, role);
  }
});

test("registerSchema defaults missing role to client", () => {
  const result = registerSchema.safeParse({
    email: "client@example.com",
    password: "password123",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});
