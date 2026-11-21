import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser keeps returned id and token subject in sync", async () => {
  const result = await registerUser({
    email: "new-user@example.com",
    password: "password123",
    role: "client"
  });

  const payload = verifyAccessToken(result.token);

  assert.equal(payload.sub, result.id);
  assert.equal(result.email, "new-user@example.com");
  assert.equal(result.role, "client");
});
