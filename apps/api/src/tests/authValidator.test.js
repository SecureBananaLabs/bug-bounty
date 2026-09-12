import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const baseRegistration = {
  email: "user@example.com",
  password: "password123"
};

test("registration defaults omitted role to client", () => {
  const result = registerSchema.parse(baseRegistration);
  assert.equal(result.role, "client");
});

test("registration accepts client role", () => {
  const result = registerSchema.parse({ ...baseRegistration, role: "client" });
  assert.equal(result.role, "client");
});

test("registration accepts freelancer role", () => {
  const result = registerSchema.parse({ ...baseRegistration, role: "freelancer" });
  assert.equal(result.role, "freelancer");
});

test("registration rejects admin role", () => {
  const result = registerSchema.safeParse({ ...baseRegistration, role: "admin" });
  assert.equal(result.success, false);
});
