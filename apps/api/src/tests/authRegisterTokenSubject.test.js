import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns a token subject that matches the created user id", async () => {
  const result = await registerUser({
    email: "alice@example.com",
    password: "password123",
    role: "client"
  });
  const payload = verifyAccessToken(result.token);

  assert.equal(payload.sub, result.id);
  assert.equal(payload.role, "client");
});
