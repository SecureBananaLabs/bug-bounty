import test from "node:test";
import assert from "node:assert/strict";
import { refreshToken } from "../services/authService.js";

test("refreshToken throws when no token is supplied", async () => {
  await assert.rejects(
    () => refreshToken(undefined),
    /Refresh token required/
  );
});

test("refreshToken returns a token when a credential is supplied", async () => {
  const result = await refreshToken("some-refresh-token");
  assert.ok(typeof result.token === "string" && result.token.length > 0);
});
