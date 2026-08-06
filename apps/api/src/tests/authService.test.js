import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the returned user id", async () => {
  const result = await registerUser({
    email: "new-client@example.com",
    password: "password123",
    role: "client"
  });
  const tokenPayload = verifyAccessToken(result.token);

  assert.match(result.id, /^usr_\d+$/);
  assert.equal(tokenPayload.sub, result.id);
  assert.equal(tokenPayload.role, "client");
});
