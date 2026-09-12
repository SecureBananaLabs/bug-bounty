import assert from "node:assert/strict";
import test from "node:test";
import { loginUser } from "../services/authService.js";
import { loginSchema } from "../validators/auth.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("login schema preserves supplied user roles", () => {
  const payload = loginSchema.parse({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });

  assert.equal(payload.role, "freelancer");
});

test("login tokens use the supplied user role", async () => {
  const result = await loginUser({
    email: "freelancer@example.com",
    password: "password123",
    role: "freelancer"
  });
  const claims = verifyAccessToken(result.token);

  assert.equal(claims.role, "freelancer");
});

test("login tokens default to client when no role is available", async () => {
  const result = await loginUser({
    email: "client@example.com",
    password: "password123"
  });
  const claims = verifyAccessToken(result.token);

  assert.equal(claims.role, "client");
});
