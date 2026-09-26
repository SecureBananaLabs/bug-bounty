import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("auth validators reject whitespace-only passwords", () => {
  const registerResult = registerSchema.safeParse({
    email: "new@example.com",
    password: "        "
  });
  const loginResult = loginSchema.safeParse({
    email: "new@example.com",
    password: "        "
  });

  assert.equal(registerResult.success, false);
  assert.equal(loginResult.success, false);
});

test("auth validators require eight non-whitespace password characters", () => {
  const tooShortResult = registerSchema.safeParse({
    email: "new@example.com",
    password: "abcd    "
  });
  const validResult = registerSchema.safeParse({
    email: "new@example.com",
    password: "abcd efgh"
  });

  assert.equal(tooShortResult.success, false);
  assert.equal(validResult.success, true);
  assert.equal(validResult.data.password, "abcd efgh");
});
