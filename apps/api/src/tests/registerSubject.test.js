import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the token for the id it returns", async () => {
  const result = await registerUser({ email: "case@example.com", role: "client" });
  const claims = verifyAccessToken(result.token);

  assert.equal(result.id, claims.sub);
  assert.equal(claims.role, "client");
});
