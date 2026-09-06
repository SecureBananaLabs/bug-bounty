import assert from "node:assert/strict";
import { test } from "node:test";

import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the access token for the returned user id", async () => {
  const result = await registerUser({
    email: "new-client@example.com",
    password: "password123",
    role: "client"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, result.role);
});
