import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser access token subject matches returned user id", async () => {
  const result = await registerUser({
    email: "new-client@example.com",
    password: "password123",
    role: "client"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(typeof result.id, "string");
  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, result.role);
});
