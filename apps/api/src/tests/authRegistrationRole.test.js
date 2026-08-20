import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema defaults public registrations to client role", () => {
  const parsed = registerSchema.parse({
    email: "client@example.com",
    password: "securepass"
  });

  assert.equal(parsed.role, "client");
});

test("registerSchema accepts freelancer public registrations", () => {
  const parsed = registerSchema.parse({
    email: "freelancer@example.com",
    password: "securepass",
    role: "freelancer"
  });

  assert.equal(parsed.role, "freelancer");
});

test("registerSchema rejects admin role self-assignment", () => {
  const parsed = registerSchema.safeParse({
    email: "admin@example.com",
    password: "securepass",
    role: "admin"
  });

  assert.equal(parsed.success, false);
});
