import test from "node:test";
import assert from "node:assert";
import { registerUser, loginUser, refreshToken } from "../services/authService.js";
import { signAccessToken } from "../utils/jwt.js";

test("refreshToken service validation", async (t) => {
  await t.test("should successfully refresh a valid token", async () => {
    const originalToken = signAccessToken({ sub: "usr_test123", role: "freelancer" });
    const result = await refreshToken(originalToken);
    assert.ok(result.token);
  });

  await t.test("should reject an invalid token", async () => {
    await assert.rejects(
      async () => {
        await refreshToken("invalid-token-value");
      },
      /Invalid or expired refresh token/
    );
  });
});
