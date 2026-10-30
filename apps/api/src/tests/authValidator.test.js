import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("auth schemas reject whitespace-only passwords", () => {
  const payload = {
    email: "person@example.com",
    password: "        ",
  };

  assert.equal(registerSchema.safeParse(payload).success, false);
  assert.equal(loginSchema.safeParse(payload).success, false);
});

test("auth schemas preserve non-blank passwords that meet the length requirement", () => {
  const payload = {
    email: "person@example.com",
    password: "  abcdef  ",
  };

  assert.equal(registerSchema.safeParse(payload).success, true);
  assert.equal(loginSchema.safeParse(payload).success, true);
});
