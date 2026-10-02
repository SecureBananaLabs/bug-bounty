import test from "node:test";
import assert from "node:assert/strict";
import { refreshSchema } from "../validators/auth.js";
import { refreshToken } from "../services/authService.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("refresh requires and validates the provided refresh token", async () => {
  assert.throws(() => refreshSchema.parse({}));

  const original = signAccessToken({ sub: "usr_123", role: "freelancer" });
  const refreshed = await refreshToken(original);
  const decoded = verifyAccessToken(refreshed.token);

  assert.equal(decoded.sub, "usr_123");
  assert.equal(decoded.role, "freelancer");
  await assert.rejects(() => refreshToken("not-a-valid-token"));
});
