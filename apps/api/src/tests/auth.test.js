import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

test("registerSchema requires a non-empty fullName", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        fullName: "   ",
        email: "user@example.com",
        password: "password123",
        role: "client"
      }),
    /String must contain at least 1 character/
  );
});

test("registerUser returns fullName from validated payload", async () => {
  const payload = registerSchema.parse({
    fullName: "Anicca Test",
    email: "user@example.com",
    password: "password123",
    role: "freelancer"
  });

  const result = await registerUser(payload);

  assert.equal(result.fullName, "Anicca Test");
  assert.equal(result.email, "user@example.com");
  assert.equal(result.role, "freelancer");
  assert.ok(result.token);
});
