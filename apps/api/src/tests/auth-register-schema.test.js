import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects public admin role signup", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "admin-claim@example.com",
      password: "correct-horse-battery-staple",
      role: "admin"
    });
  });
});
