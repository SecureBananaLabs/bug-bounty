import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

const validEmail = "user@example.com";
const validPassword = "correct horse battery staple";
const oversizedPassword = "a".repeat(129);

test("registerSchema accepts passwords up to 128 characters", () => {
  const parsed = registerSchema.parse({
    email: validEmail,
    password: "a".repeat(128)
  });

  assert.equal(parsed.password.length, 128);
});

test("registerSchema rejects passwords over 128 characters", () => {
  assert.throws(
    () => registerSchema.parse({ email: validEmail, password: oversizedPassword }),
    /at most 128/
  );
});

test("loginSchema accepts normal passwords", () => {
  const parsed = loginSchema.parse({
    email: validEmail,
    password: validPassword
  });

  assert.equal(parsed.password, validPassword);
});

test("loginSchema rejects passwords over 128 characters", () => {
  assert.throws(
    () => loginSchema.parse({ email: validEmail, password: oversizedPassword }),
    /at most 128/
  );
});
