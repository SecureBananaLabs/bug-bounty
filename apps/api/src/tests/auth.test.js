import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser returns matching id and token sub", async () => {
  const result = await registerUser({ email: "test@test.com", role: "freelancer" });
  const tokenParts = result.token.split(".");
  const payload = JSON.parse(Buffer.from(tokenParts[1], "base64url").toString());
  assert.equal(payload.sub, result.id, "token sub must match user id");
});
