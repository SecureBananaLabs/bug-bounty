import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the returned user id as the access-token subject", async (t) => {
  let timestamp = 1700000000000;
  t.mock.method(Date, "now", () => timestamp++);

  const user = await registerUser({
    email: "new-client@example.com",
    role: "client",
    password: "correct-horse-battery-staple"
  });
  const tokenPayload = verifyAccessToken(user.token);

  assert.equal(tokenPayload.sub, user.id);
});
