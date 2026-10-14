import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { registerSchema } from "../validators/auth.js";

const baseRegistration = {
  email: "person@example.com",
  password: "password123"
};

test("registerSchema defaults omitted role to client", () => {
  const payload = registerSchema.parse(baseRegistration);

  assert.equal(payload.role, "client");
});

test("registerSchema accepts public registration roles", () => {
  assert.equal(
    registerSchema.parse({ ...baseRegistration, role: "client" }).role,
    "client",
  );
  assert.equal(
    registerSchema.parse({ ...baseRegistration, role: "freelancer" }).role,
    "freelancer",
  );
});

test("registerSchema rejects admin role self-assignment", () => {
  assert.throws(
    () => registerSchema.parse({ ...baseRegistration, role: "admin" }),
    ZodError,
  );
});
