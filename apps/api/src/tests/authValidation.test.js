import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const registration = {
  email: "new.user@example.com",
  password: "strong-password-123"
};

test("registerSchema rejects admin self-assignment", () => {
  const result = registerSchema.safeParse({
    ...registration,
    role: "admin"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "role");
});

test("registerSchema accepts public registration roles", () => {
  assert.equal(registerSchema.safeParse({ ...registration, role: "client" }).success, true);
  assert.equal(registerSchema.safeParse({ ...registration, role: "freelancer" }).success, true);
});

test("registerSchema defaults missing role to client", () => {
  const result = registerSchema.parse(registration);

  assert.equal(result.role, "client");
});
