import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../validators/auth.js";

test("registerSchema rejects whitespace-only passwords", () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "        ",
    role: "client",
  });
  assert.equal(result.success, false);
  assert.ok(result.error.message.includes("whitespace"));
});

test("registerSchema accepts valid passwords", () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "securePass123!",
    role: "client",
  });
  assert.equal(result.success, true);
});

test("loginSchema rejects whitespace-only passwords", () => {
  const result = loginSchema.safeParse({
    email: "test@example.com",
    password: "          ",
  });
  assert.equal(result.success, false);
  assert.ok(result.error.message.includes("whitespace"));
});

test("loginSchema accepts valid passwords", () => {
  const result = loginSchema.safeParse({
    email: "test@example.com",
    password: "myRealPassword",
  });
  assert.equal(result.success, true);
});

test("registerSchema rejects short passwords", () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "ab",
    role: "client",
  });
  assert.equal(result.success, false);
});
