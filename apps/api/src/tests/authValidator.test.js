import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../validators/auth.js";

test("registerSchema trims whitespace and lowercases email", () => {
  const result = registerSchema.parse({
    email: "  Alice@Example.COM  ",
    password: "supersecret"
  });
  assert.equal(result.email, "alice@example.com");
});

test("loginSchema rejects empty email after trim", () => {
  const result = loginSchema.safeParse({
    email: "   ",
    password: "supersecret"
  });
  assert.equal(result.success, false);
});

test("loginSchema normalises mixed-case email with surrounding spaces", () => {
  const result = loginSchema.parse({
    email: "\tBob@Example.com\n",
    password: "supersecret"
  });
  assert.equal(result.email, "bob@example.com");
});
