import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, MAX_PASSWORD_LENGTH, registerSchema } from "../validators/auth.js";

const validPassword = "a".repeat(MAX_PASSWORD_LENGTH);
const oversizedPassword = "a".repeat(MAX_PASSWORD_LENGTH + 1);

test("auth password validators accept passwords at the configured maximum", () => {
  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "client@example.com",
      password: validPassword,
      role: "client"
    });
  });

  assert.doesNotThrow(() => {
    loginSchema.parse({
      email: "client@example.com",
      password: validPassword
    });
  });
});

test("auth password validators reject oversized passwords", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "client@example.com",
        password: oversizedPassword,
        role: "client"
      }),
    /at most 128 character/
  );

  assert.throws(
    () =>
      loginSchema.parse({
        email: "client@example.com",
        password: oversizedPassword
      }),
    /at most 128 character/
  );
});
