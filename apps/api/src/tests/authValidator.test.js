import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const validRegistration = {
  email: "user@example.com",
  password: "correct-horse-battery-staple"
};

test("registerSchema defaults public signups to client role", () => {
  const parsed = registerSchema.parse(validRegistration);

  assert.equal(parsed.role, "client");
});

test("registerSchema allows freelancer public signups", () => {
  const parsed = registerSchema.parse({
    ...validRegistration,
    role: "freelancer"
  });

  assert.equal(parsed.role, "freelancer");
});

test("registerSchema rejects admin role on public signup", () => {
  const result = registerSchema.safeParse({
    ...validRegistration,
    role: "admin"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "role");
});
