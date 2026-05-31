import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin self-assignment", () => {
  const result = registerSchema.safeParse({
    email: "new-user@example.com",
    password: "password123",
    role: "admin"
  });

  assert.equal(result.success, false);
});

test("registerSchema still accepts public registration roles", () => {
  const clientResult = registerSchema.safeParse({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  const freelancerResult = registerSchema.safeParse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(clientResult.success, true);
  assert.equal(freelancerResult.success, true);
});
