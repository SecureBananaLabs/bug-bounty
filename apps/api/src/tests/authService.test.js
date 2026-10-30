import test from "node:test";
import assert from "node:assert/strict";

import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns consistent id and sub", async () => {
  const user = await registerUser({ email: "test@example.com", role: "client" });

  assert.equal(typeof user.id, "string");
  assert.match(user.id, /^usr_\d+$/);

  // The token's sub must equal the returned id (regression test for #2845).
  const payload = verifyAccessToken(user.token);
  assert.equal(payload.sub, user.id);
});
