import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs a token for the returned user id", async () => {
  const user = await registerUser({
    email: "client@example.com",
    role: "client"
  });

  const claims = verifyAccessToken(user.token);

  assert.equal(claims.sub, user.id);
  assert.equal(claims.role, "client");
});
