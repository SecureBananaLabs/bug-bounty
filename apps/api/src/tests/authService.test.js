import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser token subject matches returned user id", async () => {
  const result = await registerUser({
    email: "new-client@example.com",
    password: "strong-password",
    role: "client"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, "client");
});
