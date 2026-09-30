import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const baseRegistration = {
  email: "user@example.com",
  password: "correct-horse"
};

test("registerSchema defaults public registrations to client role", () => {
  const parsed = registerSchema.parse(baseRegistration);

  assert.equal(parsed.role, "client");
});

test("registerSchema accepts public registration roles", () => {
  assert.equal(registerSchema.parse({ ...baseRegistration, role: "client" }).role, "client");
  assert.equal(registerSchema.parse({ ...baseRegistration, role: "freelancer" }).role, "freelancer");
});

test("registerSchema rejects admin role self-assignment", () => {
  assert.throws(
    () => registerSchema.parse({ ...baseRegistration, role: "admin" }),
    /Invalid enum value/
  );
});
