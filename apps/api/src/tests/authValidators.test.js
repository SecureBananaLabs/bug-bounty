import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

const baseRegisterPayload = {
  email: "client@example.com",
  role: "client"
};

test("auth schemas accept passwords up to 128 characters", () => {
  const password = "a".repeat(128);

  assert.equal(
    registerSchema.safeParse({ ...baseRegisterPayload, password }).success,
    true
  );
  assert.equal(
    loginSchema.safeParse({ email: baseRegisterPayload.email, password }).success,
    true
  );
});

test("auth schemas reject oversized passwords", () => {
  const password = "a".repeat(129);

  assert.equal(
    registerSchema.safeParse({ ...baseRegisterPayload, password }).success,
    false
  );
  assert.equal(
    loginSchema.safeParse({ email: baseRegisterPayload.email, password }).success,
    false
  );
});
