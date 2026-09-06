import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with the returned user id", async () => {
  const result = await registerUser({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });

  const decoded = verifyAccessToken(result.token);

  assert.match(result.id, /^usr_\d+$/);
  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, "client");
});
