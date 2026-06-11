import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const validRegistration = {
  email: "client@example.com",
  password: "password123"
};

test("registerSchema defaults omitted role to client", () => {
  const result = registerSchema.parse(validRegistration);

  assert.equal(result.role, "client");
});

test("registerSchema accepts public freelancer role", () => {
  const result = registerSchema.safeParse({
    ...validRegistration,
    role: "freelancer"
  });

  assert.equal(result.success, true);
});

test("registerSchema rejects public admin role assignment", () => {
  const result = registerSchema.safeParse({
    ...validRegistration,
    role: "admin"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "role");
});
