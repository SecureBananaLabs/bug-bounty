import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

test("registerSchema requires a non-empty fullName", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "client@example.com",
      password: "password123",
      role: "client"
    });
  });

  assert.throws(() => {
    registerSchema.parse({
      email: "client@example.com",
      password: "password123",
      fullName: "   ",
      role: "client"
    });
  });
});

test("registerUser preserves a valid fullName", async () => {
  const result = await registerUser({
    email: "client@example.com",
    password: "password123",
    fullName: "Avery Client",
    role: "client"
  });

  assert.equal(result.fullName, "Avery Client");
});
