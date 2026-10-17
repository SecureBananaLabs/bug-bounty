import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns id matching token subject", async () => {
  const payload = {
    email: "test@example.com",
    role: "client"
  };

  const result = await registerUser(payload);

  assert.ok(result.id);
  assert.ok(result.token);
  assert.equal(result.email, payload.email);
  assert.equal(result.role, payload.role);

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, result.role);
});
