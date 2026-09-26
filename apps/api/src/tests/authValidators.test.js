import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

const validEmail = "alan@example.com";

test("auth validators accept 128 character passwords", () => {
  const password = "a".repeat(128);

  assert.equal(registerSchema.safeParse({ email: validEmail, password }).success, true);
  assert.equal(loginSchema.safeParse({ email: validEmail, password }).success, true);
});

test("auth validators reject passwords longer than 128 characters", () => {
  const password = "a".repeat(129);

  assert.equal(registerSchema.safeParse({ email: validEmail, password }).success, false);
  assert.equal(loginSchema.safeParse({ email: validEmail, password }).success, false);
});
