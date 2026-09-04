import test from "node:test";
import assert from "node:assert/strict";
import { refreshToken } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("refreshToken signs access tokens with canonical client role casing", async () => {
  const result = await refreshToken();
  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, "usr_existing");
  assert.equal(decoded.role, "CLIENT");
});
