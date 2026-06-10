import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const baseRegistration = {
  email: "user@example.com",
  password: "password123"
};

test("registerSchema only allows public roles", () => {
  assert.equal(registerSchema.safeParse({ ...baseRegistration, role: "client" }).success, true);
  assert.equal(registerSchema.safeParse({ ...baseRegistration, role: "freelancer" }).success, true);
  assert.equal(registerSchema.safeParse({ ...baseRegistration, role: "admin" }).success, false);
});

test("registerSchema defaults missing role to client", () => {
  const parsed = registerSchema.parse(baseRegistration);

  assert.equal(parsed.role, "client");
});
