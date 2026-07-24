import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("registerSchema defaults new users to client role", () => {
  const payload = registerSchema.parse({
    email: "new-client@example.com",
    password: "correct-horse"
  });

  assert.equal(payload.role, "client");
});

test("registerSchema allows normal public account roles", () => {
  assert.equal(
    registerSchema.parse({
      email: "builder@example.com",
      password: "correct-horse",
      role: "freelancer"
    }).role,
    "freelancer"
  );
});

test("registerSchema rejects admin role self-assignment", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "admin-request@example.com",
        password: "correct-horse",
        role: "admin"
      }),
    (error) => error.issues?.some((issue) => issue.path?.[0] === "role")
  );
});
