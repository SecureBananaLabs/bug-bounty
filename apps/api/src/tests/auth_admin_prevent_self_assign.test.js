import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

test("registerSchema rejects admin role self-assignment", () => {
  const result = registerSchema.safeParse({
    fullName: "Attacker User",
    email: "attacker@example.com",
    password: "password123",
    role: "admin"
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].code, "invalid_enum_value");
});

test("registerSchema accepts client and freelancer roles", () => {
  const clientResult = registerSchema.safeParse({
    fullName: "Client User",
    email: "user@example.com",
    password: "password123",
    role: "client"
  });
  assert.equal(clientResult.success, true);
  assert.equal(clientResult.data.role, "client");
  assert.equal(clientResult.data.fullName, "Client User");

  const freelancerResult = registerSchema.safeParse({
    fullName: "Freelancer User",
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(freelancerResult.success, true);
  assert.equal(freelancerResult.data.role, "freelancer");
  assert.equal(freelancerResult.data.fullName, "Freelancer User");
});

test("registerSchema defaults to client role when omitted", () => {
  const result = registerSchema.safeParse({
    fullName: "Default User",
    email: "default@example.com",
    password: "password123"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});

test("registerSchema requires fullName and rejects missing or empty string", () => {
  const missingResult = registerSchema.safeParse({
    email: "noname@example.com",
    password: "password123"
  });
  assert.equal(missingResult.success, false);

  const emptyResult = registerSchema.safeParse({
    fullName: "   ",
    email: "emptyname@example.com",
    password: "password123"
  });
  assert.equal(emptyResult.success, false);
});

test("registerUser service throws if payload role is admin", async () => {
  await assert.rejects(
    async () => {
      await registerUser({
        fullName: "Attacker Admin",
        email: "attacker@example.com",
        password: "password123",
        role: "admin"
      });
    },
    {
      name: "Error",
      message: "Admin role self-assignment is forbidden"
    }
  );
});
