import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the returned user id", async () => {
  const result = await registerUser({
    email: "new-client@example.com",
    password: "correct horse battery staple",
    role: "client",
  });
  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, result.role);
  assert.equal(result.email, "new-client@example.com");
});
