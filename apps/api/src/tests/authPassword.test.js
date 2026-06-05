import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

const MAX_PASSWORD = "a".repeat(128);
const OVERLONG_PASSWORD = "a".repeat(129);

test("registerSchema accepts passwords up to 128 characters", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: MAX_PASSWORD,
    role: "client"
  });

  assert.equal(payload.password, MAX_PASSWORD);
});

test("registerSchema rejects passwords longer than 128 characters", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "client@example.com",
        password: OVERLONG_PASSWORD,
        role: "client"
      }),
    /String must contain at most 128 character/
  );
});

test("loginSchema accepts passwords up to 128 characters", () => {
  const payload = loginSchema.parse({
    email: "client@example.com",
    password: MAX_PASSWORD
  });

  assert.equal(payload.password, MAX_PASSWORD);
});

test("loginSchema rejects passwords longer than 128 characters", () => {
  assert.throws(
    () =>
      loginSchema.parse({
        email: "client@example.com",
        password: OVERLONG_PASSWORD
      }),
    /String must contain at most 128 character/
  );
});
