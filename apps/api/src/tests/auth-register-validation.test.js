import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema allows a valid client registration", () => {
  const result = registerSchema.parse({
    email: "client@test.com",
    password: "supersecret123",
    role: "client",
  });
  assert.equal(result.role, "client");
  assert.equal(result.email, "client@test.com");
});

test("registerSchema allows a valid freelancer registration", () => {
  const result = registerSchema.parse({
    email: "freelancer@test.com",
    password: "anotherpass456",
    role: "freelancer",
  });
  assert.equal(result.role, "freelancer");
});

test("registerSchema defaults to client role when omitted", () => {
  const result = registerSchema.parse({
    email: "default@test.com",
    password: "password789",
  });
  assert.equal(result.role, "client");
});

test("registerSchema rejects admin role", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "admin@test.com",
      password: "adminpass000",
      role: "admin",
    });
  }, /Invalid enum value.*admin/);
});

test("registerSchema rejects unknown role", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "hacker@test.com",
      password: "hackpass111",
      role: "superadmin",
    });
  }, /Invalid enum value/);
});
