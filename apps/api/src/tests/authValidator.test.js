import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

const validEmail = "worker@example.com";
const maxPassword = "a".repeat(128);
const tooLongPassword = "a".repeat(129);

test("auth validators accept 128-character passwords", () => {
  const registerResult = registerSchema.safeParse({
    email: validEmail,
    password: maxPassword,
    role: "client"
  });
  const loginResult = loginSchema.safeParse({
    email: validEmail,
    password: maxPassword
  });

  assert.equal(registerResult.success, true);
  assert.equal(loginResult.success, true);
});

test("auth validators reject passwords longer than 128 characters", () => {
  const registerResult = registerSchema.safeParse({
    email: validEmail,
    password: tooLongPassword,
    role: "client"
  });
  const loginResult = loginSchema.safeParse({
    email: validEmail,
    password: tooLongPassword
  });

  assert.equal(registerResult.success, false);
  assert.equal(loginResult.success, false);
});
