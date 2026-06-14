import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const validEmail = "user@example.com";
const validPassword = "correct horse battery staple";

test("registerSchema rejects admin role self-assignment", () => {
  assert.throws(
    () => registerSchema.parse({
      email: validEmail,
      password: validPassword,
      role: "admin"
    }),
    /Invalid enum value/
  );
});

test("registerSchema still accepts public registration roles", () => {
  assert.equal(
    registerSchema.parse({
      email: validEmail,
      password: validPassword,
      role: "freelancer"
    }).role,
    "freelancer"
  );
});
