import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registration token subject matches returned user id", async () => {
  const result = await registerUser({
    email: "maya@example.com",
    password: "strong-password",
    role: "freelancer"
  });

  const payload = verifyAccessToken(result.token);

  assert.equal(payload.sub, result.id);
});
