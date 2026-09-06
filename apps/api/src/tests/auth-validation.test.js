import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("public registration rejects admin role assignment", () => {
  assert.equal(
    registerSchema.parse({
      email: "client@example.com",
      password: "password123"
    }).role,
    "client"
  );

  assert.throws(() => {
    registerSchema.parse({
      email: "attacker@example.com",
      password: "password123",
      role: "admin"
    });
  });
});
