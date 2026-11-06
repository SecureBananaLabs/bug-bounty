import test from "node:test";
import assert from "node:assert/strict";

import { loginUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("loginUser signs tokens with the provided role", async () => {
  const result = await loginUser({ email: "admin@example.com", role: "admin" });
  const claims = verifyAccessToken(result.token);

  assert.equal(claims.sub, "usr_existing");
  assert.equal(claims.role, "admin");
});

test("loginUser keeps client as the default role", async () => {
  const result = await loginUser({ email: "client@example.com" });
  const claims = verifyAccessToken(result.token);

  assert.equal(claims.sub, "usr_existing");
  assert.equal(claims.role, "client");
});
