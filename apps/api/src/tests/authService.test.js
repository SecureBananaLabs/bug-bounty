import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns an id matching the JWT sub claim even if Date.now() changes between calls", async (t) => {
  let call = 0;
  t.mock.method(Date, "now", () => {
    call += 1;
    return call === 1 ? 1000 : 2000;
  });

  const result = await registerUser({ email: "new@example.com", role: "client" });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, result.id);
});
