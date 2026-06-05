import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects public admin self-assignment", () => {
  const result = registerSchema.safeParse({
    email: "user@example.com",
    password: "password123",
    role: "admin"
  });

  assert.equal(result.success, false);
});

test("registerSchema accepts public registration roles", () => {
  for (const role of ["client", "freelancer"]) {
    const result = registerSchema.safeParse({
      email: `${role}@example.com`,
      password: "password123",
      role
    });

    assert.equal(result.success, true);
    assert.equal(result.data.role, role);
  }
});

test("registerSchema defaults omitted role to client", () => {
  const result = registerSchema.parse({
    email: "default@example.com",
    password: "password123"
  });

  assert.equal(result.role, "client");
});
