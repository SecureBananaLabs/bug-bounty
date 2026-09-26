import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("auth validators reject whitespace-only registration passwords", () => {
  const result = registerSchema.safeParse({
    email: "user@example.com",
    password: "        "
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "password");
  assert.equal(result.error.issues[0].message, "Password cannot be blank");
});

test("auth validators reject whitespace-only login passwords", () => {
  const result = loginSchema.safeParse({
    email: "user@example.com",
    password: "        "
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "password");
  assert.equal(result.error.issues[0].message, "Password cannot be blank");
});

test("auth validators preserve minimum password length", () => {
  const result = registerSchema.safeParse({
    email: "user@example.com",
    password: "short"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "password");
});

test("auth validators still accept non-blank valid passwords", () => {
  const registerResult = registerSchema.safeParse({
    email: "user@example.com",
    password: "password123"
  });
  const loginResult = loginSchema.safeParse({
    email: "user@example.com",
    password: "password123"
  });

  assert.equal(registerResult.success, true);
  assert.equal(registerResult.data.role, "client");
  assert.equal(loginResult.success, true);
});
