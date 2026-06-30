import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

test("registerSchema rejects missing fullName", async () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    role: "client"
  });
  assert.equal(result.success, false);
});

test("registerSchema accepts valid fullName", async () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    fullName: "John Doe",
    role: "client"
  });
  assert.equal(result.success, true);
});

test("registerUser returns fullName in payload", async () => {
  const payload = {
    email: "test@example.com",
    password: "password123",
    fullName: "John Doe",
    role: "client"
  };
  const user = await registerUser(payload);
  assert.equal(user.fullName, "John Doe");
});

test("registerSchema rejects short fullName", async () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    fullName: "A",
    role: "client"
  });
  assert.equal(result.success, false);
});

test("registerSchema rejects long fullName", async () => {
  const result = registerSchema.safeParse({
    email: "test@example.com",
    password: "password123",
    fullName: "A".repeat(101),
    role: "client"
  });
  assert.equal(result.success, false);
});
