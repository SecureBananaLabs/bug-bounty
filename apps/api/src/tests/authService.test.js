import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs an access token for the returned user id", async () => {
  const user = await registerUser({
    email: "new-user@example.com",
    password: "password123",
    role: "client"
  });

  const payload = verifyAccessToken(user.token);

  assert.equal(payload.sub, user.id);
  assert.equal(payload.role, user.role);
});
