import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns consistent user id and token subject", async () => {
  const result = await registerUser({
    email: "test@example.com",
    password: "password123",
    role: "client"
  });

  assert.ok(result.id.startsWith("usr_"), "id should start with usr_");

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id, "token sub must equal returned id");
});
