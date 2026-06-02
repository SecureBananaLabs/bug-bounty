import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

test("register schema requires fullName", () => {
  assert.throws(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "client"
    });
  });
});

test("registerUser preserves fullName in returned payload", async () => {
  const result = await registerUser({
    fullName: "Hanif Nugraha",
    email: "test@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(result.fullName, "Hanif Nugraha");
  assert.equal(result.email, "test@example.com");
  assert.equal(result.role, "freelancer");
  assert.match(result.id, /^usr_/);
  assert.match(result.token, /^eyJ/);
});
