import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registration rejects admin role", () => {
  const result = registerSchema.safeParse({
    email: " attacker@example.com",
    password: "validpass123",
    role: "admin"
  });

  assert.equal(result.success, false, "admin role should be rejected");
  const msg = result.error.issues[0].message;
  assert.ok(msg.includes("admin") || msg.includes("Invalid"), `error should mention invalid role, got: ${msg}`);
});

test("registration accepts client and freelancer roles", () => {
  const client = registerSchema.parse({
    email: "client@example.com",
    password: "validpass123",
    role: "client"
  });
  assert.equal(client.role, "client");

  const freelancer = registerSchema.parse({
    email: "freelancer@example.com",
    password: "validpass123",
    role: "freelancer"
  });
  assert.equal(freelancer.role, "freelancer");
});

test("registration defaults to client role when omitted", () => {
  const result = registerSchema.parse({
    email: "default@example.com",
    password: "validpass123"
  });
  assert.equal(result.role, "client");
});
