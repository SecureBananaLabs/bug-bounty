import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs access token for the returned user id", async (t) => {
  const originalDateNow = Date.now;
  let timestamp = 1_780_000_000_000;

  t.after(() => {
    Date.now = originalDateNow;
  });

  Date.now = () => timestamp++;

  const result = await registerUser({
    email: "client@example.com",
    role: "client"
  });
  const tokenPayload = verifyAccessToken(result.token);

  assert.equal(result.id, "usr_1780000000000");
  assert.equal(tokenPayload.sub, result.id);
  assert.equal(tokenPayload.role, "client");
});
