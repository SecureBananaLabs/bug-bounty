import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { registerSchema } from "../validators/auth.js";

test("register schema defaults to client role", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(payload.role, "client");
});

test("register schema accepts public roles", () => {
  const payload = registerSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(payload.role, "freelancer");
});

test("register schema rejects admin role self-assignment", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "admin@example.com",
        password: "password123",
        role: "admin"
      }),
    ZodError
  );
});
