import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

const validEmail = "user@example.com";
const maxLengthPassword = "a".repeat(128);
const tooLongPassword = "a".repeat(129);

test("registerSchema accepts passwords up to 128 characters", () => {
  const payload = registerSchema.parse({
    email: validEmail,
    password: maxLengthPassword,
    role: "client"
  });

  assert.equal(payload.password, maxLengthPassword);
});

test("registerSchema rejects passwords longer than 128 characters", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: validEmail,
      password: tooLongPassword,
      role: "client"
    });
  }, /String must contain at most 128 character/);
});

test("loginSchema accepts passwords up to 128 characters", () => {
  const payload = loginSchema.parse({
    email: validEmail,
    password: maxLengthPassword
  });

  assert.equal(payload.password, maxLengthPassword);
});

test("loginSchema rejects passwords longer than 128 characters", () => {
  assert.throws(() => {
    loginSchema.parse({
      email: validEmail,
      password: tooLongPassword
    });
  }, /String must contain at most 128 character/);
});
