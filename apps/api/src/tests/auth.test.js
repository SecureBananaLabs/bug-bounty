import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser generates consistent id for response and token", async () => {
  const payload = {
    email: "test@example.com",
    password: "password123",
    role: "client"
  };

  const result = await registerUser(payload);

  // Verify id is present
  assert.ok(result.id, "Should have id");

  // Verify token is present
  assert.ok(result.token, "Should have token");

  // Verify token subject matches returned id
  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id, "Token subject should match returned id");
});
