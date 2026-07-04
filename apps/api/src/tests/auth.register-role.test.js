import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "admin@example.com",
        password: "password123",
        role: "admin"
      }),
    /invalid/i
  );
});

test("registerSchema defaults omitted role to client", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123"
  });

  assert.equal(payload.role, "client");
});

test("registerSchema keeps freelancer role valid", () => {
  const payload = registerSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(payload.role, "freelancer");
});
