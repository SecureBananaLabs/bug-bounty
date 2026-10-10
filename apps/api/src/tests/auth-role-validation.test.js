import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema accepts valid public roles", () => {
  const clientParsed = registerSchema.safeParse({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  assert.equal(clientParsed.success, true);
  assert.equal(clientParsed.data.role, "client");

  const freelancerParsed = registerSchema.safeParse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  assert.equal(freelancerParsed.success, true);
  assert.equal(freelancerParsed.data.role, "freelancer");

  const defaultRoleParsed = registerSchema.safeParse({
    email: "default@example.com",
    password: "password123"
  });
  assert.equal(defaultRoleParsed.success, true);
  assert.equal(defaultRoleParsed.data.role, "client");
});

test("registerSchema rejects admin role self-assignment", () => {
  const adminParsed = registerSchema.safeParse({
    email: "admin@example.com",
    password: "password123",
    role: "admin"
  });
  assert.equal(adminParsed.success, false);

  const issue = adminParsed.error.issues.find((i) => i.path.includes("role"));
  assert.ok(issue, "Expected a validation issue on role field");
  assert.match(issue.message, /Invalid enum value/);
});

test("registerSchema rejects unknown roles", () => {
  const superuserParsed = registerSchema.safeParse({
    email: "super@example.com",
    password: "password123",
    role: "superuser"
  });
  assert.equal(superuserParsed.success, false);

  const moderatorParsed = registerSchema.safeParse({
    email: "mod@example.com",
    password: "password123",
    role: "moderator"
  });
  assert.equal(moderatorParsed.success, false);
});
