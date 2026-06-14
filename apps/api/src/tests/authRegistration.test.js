import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

test("registerSchema rejects missing fullName", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "client@example.com",
        password: "password123",
        role: "client"
      }),
    /fullName/
  );
});

test("registerSchema rejects blank fullName", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "client@example.com",
        password: "password123",
        fullName: "   ",
        role: "client"
      }),
    /String must contain at least 1 character/
  );
});

test("registerSchema trims and preserves valid fullName", () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123",
    fullName: "  Jane Client  ",
    role: "client"
  });

  assert.equal(payload.fullName, "Jane Client");
});

test("registerUser returns fullName from validated payload", async () => {
  const user = await registerUser({
    email: "client@example.com",
    password: "password123",
    fullName: "Jane Client",
    role: "client"
  });

  assert.equal(user.fullName, "Jane Client");
});
