import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

const validEmail = "user@example.com";
const maxPassword = "a".repeat(128);
const tooLongPassword = "a".repeat(129);

test("registerSchema accepts a password at the maximum length", () => {
  const result = registerSchema.safeParse({
    email: validEmail,
    password: maxPassword,
    role: "client"
  });

  assert.equal(result.success, true);
});

test("registerSchema rejects a password over the maximum length", () => {
  const result = registerSchema.safeParse({
    email: validEmail,
    password: tooLongPassword,
    role: "client"
  });

  assert.equal(result.success, false);
});

test("loginSchema accepts a password at the maximum length", () => {
  const result = loginSchema.safeParse({
    email: validEmail,
    password: maxPassword
  });

  assert.equal(result.success, true);
});

test("loginSchema rejects a password over the maximum length", () => {
  const result = loginSchema.safeParse({
    email: validEmail,
    password: tooLongPassword
  });

  assert.equal(result.success, false);
});
