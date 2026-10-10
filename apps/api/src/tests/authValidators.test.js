import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("registerSchema rejects whitespace-only passwords", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "user@example.com",
      password: "        "
    });
  });
});

test("loginSchema rejects whitespace-only passwords", () => {
  assert.throws(() => {
    loginSchema.parse({
      email: "user@example.com",
      password: "        "
    });
  });
});

test("auth schemas still accept non-whitespace passwords of sufficient length", () => {
  assert.equal(
    registerSchema.parse({
      email: "user@example.com",
      password: "correct horse"
    }).password,
    "correct horse"
  );

  assert.equal(
    loginSchema.parse({
      email: "user@example.com",
      password: "correct horse"
    }).password,
    "correct horse"
  );
});
