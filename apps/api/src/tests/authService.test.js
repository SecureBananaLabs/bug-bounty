import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the token for the returned user id", async (t) => {
  const originalNow = Date.now;
  const timestamps = [1_820_000_000_000, 1_820_000_000_123];
  let callIndex = 0;
  Date.now = () => timestamps[Math.min(callIndex++, timestamps.length - 1)];
  t.after(() => {
    Date.now = originalNow;
  });

  const result = await registerUser({
    email: "new-client@example.com",
    password: "correct horse battery staple",
    role: "client"
  });
  const decoded = verifyAccessToken(result.token);

  assert.equal(result.id, "usr_1820000000000");
  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, "client");
});
