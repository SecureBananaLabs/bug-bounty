import test from "node:test";
import assert from "node:assert/strict";
import { loginUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("loginUser signs tokens with the supplied user role", async () => {
  const result = await loginUser({
    email: "freelancer@example.com",
    password: "correct horse battery staple",
    role: "freelancer"
  });

  const claims = verifyAccessToken(result.token);

  assert.equal(result.email, "freelancer@example.com");
  assert.equal(claims.role, "freelancer");
});
