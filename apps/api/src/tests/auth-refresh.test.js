import test from "node:test";
import assert from "node:assert/strict";
import { registerUser, refreshToken } from "../services/authService.js";

test("#2847 refreshToken: rejects missing token", async () => {
  await assert.rejects(
    () => refreshToken(null),
    { message: /jwt must be provided|invalid/i }
  );
});

test("#2847 refreshToken: rejects invalid token", async () => {
  await assert.rejects(
    () => refreshToken("not.a.real.jwt"),
    { message: /invalid signature|jwt malformed/i }
  );
});

test("#2847 refreshToken: issues new token preserving original subject", async () => {
  // First register to get a valid token
  const registered = await registerUser({
    email: "refresh@test.com",
    password: "secret1234",
    role: "client"
  });

  // Now refresh with that token
  const refreshed = await refreshToken(registered.token);

  assert.ok(refreshed.token, "refreshed response must include a token");

  // Decode both tokens
  const decode = (t) => JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString());
  const originalPayload = decode(registered.token);
  const refreshedPayload = decode(refreshed.token);

  assert.equal(refreshedPayload.sub, originalPayload.sub, "refreshed token sub must match original");
  assert.equal(refreshedPayload.role, originalPayload.role, "refreshed token role must match original");
});
