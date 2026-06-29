import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("public registration defaults to client role", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123",
  });

  assert.equal(payload.role, "client");
});

test("public registration allows non-admin user roles", () => {
  const clientPayload = registerSchema.parse({
    email: "client@example.com",
    password: "password123",
    role: "client",
  });
  const freelancerPayload = registerSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer",
  });

  assert.equal(clientPayload.role, "client");
  assert.equal(freelancerPayload.role, "freelancer");
});

test("public registration rejects admin role", () => {
  assert.throws(
    () => registerSchema.parse({
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    }),
    /Invalid enum value/
  );
});
