import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const baseRegistration = {
  email: "user@example.com",
  password: "password123"
};

test("registration rejects admin role self-assignment", () => {
  assert.throws(() => {
    registerSchema.parse({
      ...baseRegistration,
      role: "admin"
    });
  });
});

test("registration accepts public roles", () => {
  assert.equal(registerSchema.parse({ ...baseRegistration, role: "client" }).role, "client");
  assert.equal(registerSchema.parse({ ...baseRegistration, role: "freelancer" }).role, "freelancer");
});

test("registration defaults omitted role to client", () => {
  assert.equal(registerSchema.parse(baseRegistration).role, "client");
});
