import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const basePayload = {
  email: "person@example.com",
  password: "password123"
};

test("registerSchema accepts public roles", () => {
  const clientPayload = registerSchema.parse(basePayload);
  const freelancerPayload = registerSchema.parse({
    ...basePayload,
    role: "freelancer"
  });

  assert.equal(clientPayload.role, "client");
  assert.equal(freelancerPayload.role, "freelancer");
});

test("registerSchema rejects admin role assignment", () => {
  const result = registerSchema.safeParse({
    ...basePayload,
    role: "admin"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "role");
});
