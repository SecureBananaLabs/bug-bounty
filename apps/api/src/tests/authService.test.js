import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs token subject with the returned user id", async () => {
  const result = await registerUser({
    email: "new.user@example.com",
    role: "freelancer"
  });

  const decoded = verifyAccessToken(result.token);

  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, "freelancer");
});
