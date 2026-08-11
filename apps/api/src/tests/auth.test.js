import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema role validation", () => {
  // Valid roles
  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "client"
    });
  });

  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "freelancer"
    });
  });

  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123"
    });
  });

  // Invalid role: admin should fail validation
  assert.throws(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "admin"
    });
  });
});
