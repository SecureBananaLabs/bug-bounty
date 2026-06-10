import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("auth validators reject whitespace-only passwords", () => {
  const payload = { email: "user@example.com", password: "        " };

  assert.equal(registerSchema.safeParse(payload).success, false);
  assert.equal(loginSchema.safeParse(payload).success, false);
});

test("auth validators keep accepting nonblank passwords", () => {
  const payload = { email: "user@example.com", password: "password123" };

  assert.equal(registerSchema.safeParse(payload).success, true);
  assert.equal(loginSchema.safeParse(payload).success, true);
});
