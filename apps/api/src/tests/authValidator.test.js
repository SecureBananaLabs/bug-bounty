import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("registerSchema rejects whitespace-only passwords", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "user@example.com",
      password: "        ",
      role: "client"
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
