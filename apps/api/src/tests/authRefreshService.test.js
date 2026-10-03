import test from "node:test";
import assert from "node:assert/strict";
import { refreshToken } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("refreshToken signs tokens with canonical client role casing", async () => {
  const result = await refreshToken();

  const claims = verifyAccessToken(result.token);

  assert.equal(claims.sub, "usr_existing");
  assert.equal(claims.role, "CLIENT");
});
