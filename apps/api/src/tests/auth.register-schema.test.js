import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects admin role assignment", () => {
  const parsed = registerSchema.safeParse({
    email: "worker@example.com",
    password: "strongpass1",
    role: "admin"
  });

  assert.equal(parsed.success, false);
});

test("registerSchema still accepts freelancer role", () => {
  const parsed = registerSchema.safeParse({
    email: "worker@example.com",
    password: "strongpass1",
    role: "freelancer"
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.role, "freelancer");
});

test("registerSchema still defaults to client role", () => {
  const parsed = registerSchema.safeParse({
    email: "worker@example.com",
    password: "strongpass1"
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.role, "client");
});
