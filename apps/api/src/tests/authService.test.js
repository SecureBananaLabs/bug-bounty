import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser uses the returned user id as the token subject", async () => {
  const user = await registerUser({
    email: "client@example.com",
    role: "client"
  });

  const tokenPayload = verifyAccessToken(user.token);

  assert.equal(tokenPayload.sub, user.id);
  assert.equal(tokenPayload.role, user.role);
});
