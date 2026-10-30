import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("loginUser signs access tokens with canonical client role casing", async () => {
  const result = await loginUser({
    email: "client@example.com",
    password: "correct-horse-battery"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, "usr_existing");
  assert.equal(decoded.role, "CLIENT");
});
