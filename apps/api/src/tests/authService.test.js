import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("loginUser signs access token with the authenticated user role", async () => {
  const result = await loginUser({
    email: "admin@example.com",
    password: "password123",
    role: "admin"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.role, "admin");
});

test("loginUser preserves existing client default when no role is available", async () => {
  const result = await loginUser({
    email: "client@example.com",
    password: "password123"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.role, "client");
});
