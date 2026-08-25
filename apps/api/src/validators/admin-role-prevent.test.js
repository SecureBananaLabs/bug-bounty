import { test } from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "./auth.js";

test("registerSchema permits client and freelancer roles", () => {
  const clientRes = registerSchema.safeParse({
    email: "user@example.com",
    password: "password123",
    role: "client",
  });
  assert.equal(clientRes.success, true, "client role must be allowed");

  const freelancerRes = registerSchema.safeParse({
    email: "dev@example.com",
    password: "password123",
    role: "freelancer",
  });
  assert.equal(freelancerRes.success, true, "freelancer role must be allowed");
});

test("registerSchema rejects admin role self-assignment", () => {
  const adminRes = registerSchema.safeParse({
    email: "attacker@example.com",
    password: "password123",
    role: "admin",
  });
  assert.equal(adminRes.success, false, "admin role self-assignment during registration must be rejected");
});
