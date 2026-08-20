import assert from "node:assert/strict";
import test from "node:test";

import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";

test("registerSchema requires a non-empty fullName", () => {
  assert.equal(
    registerSchema.safeParse({
      email: "client@example.com",
      password: "password123",
      role: "client"
    }).success,
    false
  );

  assert.equal(
    registerSchema.safeParse({
      email: "client@example.com",
      password: "password123",
      fullName: "   ",
      role: "client"
    }).success,
    false
  );
});

test("registerUser returns the validated fullName", async () => {
  const payload = registerSchema.parse({
    email: "client@example.com",
    password: "password123",
    fullName: "Ada Client",
    role: "client"
  });

  const result = await registerUser(payload);

  assert.equal(result.fullName, "Ada Client");
});
