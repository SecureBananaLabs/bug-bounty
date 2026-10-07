import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("registerSchema rejects whitespace-only passwords", () => {
  const result = registerSchema.safeParse({
    email: "person@example.com",
    password: "        ",
    role: "client",
  });

  assert.equal(result.success, false);
});

test("loginSchema rejects whitespace-only passwords", () => {
  const result = loginSchema.safeParse({
    email: "person@example.com",
    password: "        ",
  });

  assert.equal(result.success, false);
});

test("auth password schemas preserve valid minimum-length passwords", () => {
  assert.equal(
    registerSchema.safeParse({
      email: "person@example.com",
      password: "valid-pass",
      role: "client",
    }).success,
    true
  );

  assert.equal(
    loginSchema.safeParse({
      email: "person@example.com",
      password: "valid-pass",
    }).success,
    true
  );
});
