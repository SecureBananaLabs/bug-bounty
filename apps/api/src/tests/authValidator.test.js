import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const validRegistration = {
  email: "new-user@example.com",
  password: "correct horse battery staple",
};

test("registerSchema defaults public registrations to client role", () => {
  const result = registerSchema.parse(validRegistration);

  assert.equal(result.role, "client");
});

test("registerSchema allows freelancer self-registration", () => {
  const result = registerSchema.parse({
    ...validRegistration,
    role: "freelancer",
  });

  assert.equal(result.role, "freelancer");
});

test("registerSchema rejects admin role self-assignment", () => {
  const result = registerSchema.safeParse({
    ...validRegistration,
    role: "admin",
  });

  assert.equal(result.success, false);
});
