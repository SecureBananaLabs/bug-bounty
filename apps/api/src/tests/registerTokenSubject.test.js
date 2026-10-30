import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with returned user id", async () => {
  const result = await registerUser({
    email: "new@example.com",
    password: "password123",
    role: "client"
  });

  const payload = verifyAccessToken(result.token);

  assert.match(result.id, /^usr_/);
  assert.equal(payload.sub, result.id);
  assert.equal(payload.role, result.role);
});
