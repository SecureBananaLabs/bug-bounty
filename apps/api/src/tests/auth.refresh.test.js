import test from "node:test";
import assert from "node:assert/strict";
import { refreshTokenWithCredential } from "../services/authService.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("refreshTokenWithCredential returns token using source claims", async () => {
  const token = signAccessToken({ sub: "usr_abc", role: "admin" });
  const result = await refreshTokenWithCredential(token);
  const payload = verifyAccessToken(result.token);

  assert.equal(payload.sub, "usr_abc");
  assert.equal(payload.role, "admin");
});

test("refreshTokenWithCredential rejects invalid token", async () => {
  await assert.rejects(
    () => refreshTokenWithCredential("not-a-token"),
    /invalid token/i
  );
});
