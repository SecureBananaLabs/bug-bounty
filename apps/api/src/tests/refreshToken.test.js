import test from "node:test";
import assert from "node:assert/strict";
import { signAccessToken } from "../utils/jwt.js";
import { refreshToken } from "../services/authService.js";

test("refreshToken: rejects missing token", async () => {
  await assert.rejects(
    async () => refreshToken(undefined),
    (err) => {
      assert.equal(err.message, "Missing refresh token");
      assert.equal(err.statusCode, 400);
      return true;
    }
  );
});

test("refreshToken: rejects null token", async () => {
  await assert.rejects(
    async () => refreshToken(null),
    (err) => {
      assert.equal(err.message, "Missing refresh token");
      return true;
    }
  );
});

test("refreshToken: rejects empty string token", async () => {
  await assert.rejects(
    async () => refreshToken(""),
    (err) => {
      assert.equal(err.message, "Missing refresh token");
      return true;
    }
  );
});

test("refreshToken: rejects invalid token", async () => {
  await assert.rejects(
    async () => refreshToken("invalid-token"),
    (err) => {
      assert.equal(err.message, "Invalid refresh token");
      assert.equal(err.statusCode, 401);
      return true;
    }
  );
});

test("refreshToken: accepts valid token and returns new token", async () => {
  const originalToken = signAccessToken({ sub: "usr_123", role: "client" });
  const result = await refreshToken(originalToken);
  
  assert.ok(result.token);
  // Verify the new token has the same sub and role
  const { verifyAccessToken } = await import("../utils/jwt.js");
  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, "usr_123");
  assert.equal(decoded.role, "client");
});
