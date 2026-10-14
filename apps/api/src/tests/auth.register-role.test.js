import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("register schema defaults role to client", () => {
  const payload = registerSchema.parse({
    email: "user@example.com",
    password: "password123"
  });

  assert.equal(payload.role, "client");
});

test("register schema accepts freelancer role", () => {
  const payload = registerSchema.parse({
    email: "user@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(payload.role, "freelancer");
});

test("register schema rejects admin role assignment", () => {
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
