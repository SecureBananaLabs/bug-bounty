import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../validators/auth.js";

test("auth validators reject whitespace-only passwords", () => {
  const registerResult = registerSchema.safeParse({
    email: "alice@example.com",
    password: "        ",
    role: "client"
  });

  const loginResult = loginSchema.safeParse({
    email: "alice@example.com",
    password: "        "
  });

  assert.equal(registerResult.success, false);
  assert.equal(loginResult.success, false);
  assert.deepEqual(
    registerResult.error.flatten().fieldErrors.password,
    ["String must contain at least 8 character(s)"]
  );
  assert.deepEqual(
    loginResult.error.flatten().fieldErrors.password,
    ["String must contain at least 8 character(s)"]
  );
});

test("auth validators still accept real passwords", () => {
  const registerResult = registerSchema.safeParse({
    email: "alice@example.com",
    password: "correct horse battery staple",
    role: "freelancer"
  });

  const loginResult = loginSchema.safeParse({
    email: "alice@example.com",
    password: "correct horse battery staple"
  });

  assert.equal(registerResult.success, true);
  assert.equal(loginResult.success, true);
  assert.equal(registerResult.data.role, "freelancer");
});
