import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("registerSchema rejects whitespace-only passwords", () => {
  const result = registerSchema.safeParse({
    email: "blank@example.com",
    password: "        ",
    role: "client"
  });

  assert.equal(result.success, false);
});

test("loginSchema rejects whitespace-only passwords", () => {
  const result = loginSchema.safeParse({
    email: "blank@example.com",
    password: "        "
  });

  assert.equal(result.success, false);
});

test("auth password schemas still accept non-blank passwords meeting minimum length", () => {
  const registerResult = registerSchema.safeParse({
    email: "valid@example.com",
    password: "valid pass",
    role: "freelancer"
  });
  const loginResult = loginSchema.safeParse({
    email: "valid@example.com",
    password: "valid pass"
  });

  assert.equal(registerResult.success, true);
  assert.equal(loginResult.success, true);
});
