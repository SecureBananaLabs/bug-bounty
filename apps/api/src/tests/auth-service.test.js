import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with the returned user id", async (t) => {
  const originalNow = Date.now;
  let now = 1790000000000;

  Date.now = () => now++;
  t.after(() => {
    Date.now = originalNow;
  });

  const user = await registerUser({
    email: "client@example.com",
    password: "password123",
    role: "client"
  });
  const claims = verifyAccessToken(user.token);

  assert.equal(user.id, "usr_1790000000000");
  assert.equal(claims.sub, user.id);
  assert.equal(claims.role, "client");
});
