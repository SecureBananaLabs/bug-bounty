import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("registerSchema rejects whitespace-only passwords", () => {
  const result = registerSchema.safeParse({
    email: "user@example.com",
    password: "        "
  });

  assert.equal(result.success, false);
});

test("loginSchema rejects whitespace-only passwords", () => {
  const result = loginSchema.safeParse({
    email: "user@example.com",
    password: "        "
  });

  assert.equal(result.success, false);
});

test("auth password validation preserves minimum length and valid passwords", () => {
  assert.equal(
    registerSchema.safeParse({
      email: "user@example.com",
      password: "short"
    }).success,
    false
  );

  assert.equal(
    loginSchema.safeParse({
      email: "user@example.com",
      password: "valid-password"
    }).success,
    true
  );
});
