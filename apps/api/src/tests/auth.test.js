import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema defaults role to client", () => {
  const payload = registerSchema.parse({
    email: "user@example.com",
    password: "password123"
  });

  assert.equal(payload.role, "client");
});

test("registerSchema rejects admin role self-assignment", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "user@example.com",
        password: "password123",
        role: "admin"
      }),
    /Invalid enum value/
  );
});
