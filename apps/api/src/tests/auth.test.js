import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema accepts client and freelancer roles", () => {
  const clientPayload = {
    email: "client@example.com",
    password: "securePassword123",
    role: "client"
  };
  const parsedClient = registerSchema.parse(clientPayload);
  assert.equal(parsedClient.role, "client");

  const freelancerPayload = {
    email: "freelancer@example.com",
    password: "securePassword123",
    role: "freelancer"
  };
  const parsedFreelancer = registerSchema.parse(freelancerPayload);
  assert.equal(parsedFreelancer.role, "freelancer");

  const defaultPayload = {
    email: "default@example.com",
    password: "securePassword123"
  };
  const parsedDefault = registerSchema.parse(defaultPayload);
  assert.equal(parsedDefault.role, "client");
});

test("registerSchema rejects privilege escalation to admin role", () => {
  const adminPayload = {
    email: "attacker@example.com",
    password: "securePassword123",
    role: "admin"
  };

  assert.throws(() => {
    registerSchema.parse(adminPayload);
  }, /Invalid enum value/);
});
