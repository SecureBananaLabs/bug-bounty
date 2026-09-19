import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("loginUser signs tokens with canonical client role casing", async () => {
  const result = await loginUser({
    email: "existing-client@example.com",
    password: "correct-password"
  });

  const claims = verifyAccessToken(result.token);

  assert.equal(claims.sub, "usr_existing");
  assert.equal(claims.role, "CLIENT");
});
