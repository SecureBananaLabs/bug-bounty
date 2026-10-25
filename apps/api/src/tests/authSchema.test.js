import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role assignment", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "eve@example.com",
        password: "supersecret",
        role: "admin"
      }),
    /Invalid enum value/
  );
});

test("registerSchema keeps client as the default public role", () => {
  const payload = registerSchema.parse({
    email: "eve@example.com",
    password: "supersecret"
  });

  assert.equal(payload.role, "client");
});

test("registerSchema still accepts freelancer role", () => {
  const payload = registerSchema.parse({
    email: "eve@example.com",
    password: "supersecret",
    role: "freelancer"
  });

  assert.equal(payload.role, "freelancer");
});
