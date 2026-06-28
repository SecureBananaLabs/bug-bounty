import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { registerSchema } from "../validators/auth.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerSchema requires fullName", () => {
  const invalidPayload = {
    email: "test@example.com",
    password: "password123"
  };

  assert.throws(
    () => registerSchema.parse(invalidPayload),
    (error) => {
      return error.errors.some((e) => e.path.includes("fullName"));
    },
    "Should reject registration without fullName"
  );
});

test("registerSchema accepts valid payload with fullName", () => {
  const validPayload = {
    email: "test@example.com",
    password: "password123",
    fullName: "Test User"
  };

  const result = registerSchema.parse(validPayload);
  assert.equal(result.fullName, "Test User");
});

test("registerUser returns fullName in response", async () => {
  const payload = {
    email: "test@example.com",
    password: "password123",
    fullName: "Test User",
    role: "client"
  };

  const result = await registerUser(payload);
  assert.equal(result.fullName, "Test User");
});
