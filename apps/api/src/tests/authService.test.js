import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the returned user id as the token subject", async () => {
  const result = await registerUser({
    email: "person@example.com",
    password: "correct horse battery staple",
    role: "client"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, result.role);
});
