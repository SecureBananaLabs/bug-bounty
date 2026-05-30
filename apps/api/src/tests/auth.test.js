import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerSchema role validation", () => {
  // Valid roles
  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "client"
    });
  });

  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "freelancer"
    });
  });

  assert.doesNotThrow(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123"
    });
  });

  // Invalid role: admin should fail validation
  assert.throws(() => {
    registerSchema.parse({
      email: "test@example.com",
      password: "password123",
      role: "admin"
    });
  });
});

test("registerUser token sub matches returned user id", async () => {
  const payload = {
    email: "test@example.com",
    role: "client"
  };
  const result = await registerUser(payload);
  assert.ok(result.id);
  assert.ok(result.token);
  
  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id, "JWT subject must match the returned user id exactly");
});
