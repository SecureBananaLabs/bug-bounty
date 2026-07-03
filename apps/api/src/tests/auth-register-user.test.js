import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser keeps the returned id and token subject in sync", async () => {
  const result = await registerUser({
    email: "sync@example.com",
    password: "Password123",
    role: "client"
  });
  const tokenPayload = verifyAccessToken(result.token);

  assert.equal(result.id, tokenPayload.sub);
  assert.equal(result.email, "sync@example.com");
  assert.equal(result.role, "client");
});
