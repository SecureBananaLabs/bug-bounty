import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";

test("registerSchema rejects missing fullName", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        email: "new-user@example.com",
        password: "password123",
        role: "client"
      }),
    /fullName/
  );
});

test("registerUser preserves a valid fullName in the returned payload", async () => {
  const result = await registerUser({
    email: "new-user@example.com",
    fullName: "New User",
    password: "password123",
    role: "client"
  });

  assert.equal(result.fullName, "New User");
  assert.equal(result.email, "new-user@example.com");
  assert.equal(result.role, "client");
});
