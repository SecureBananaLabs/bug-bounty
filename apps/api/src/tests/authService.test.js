import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns matching id and token sub claim", async () => {
  const result = await registerUser({ email: "test@example.com", role: "client" });

  assert.ok(result.id, "result.id should be defined");
  assert.ok(result.token, "result.token should be defined");

  const decoded = verifyAccessToken(result.token);

  assert.equal(
    decoded.sub,
    result.id,
    `token sub ("${decoded.sub}") should match result.id ("${result.id}")`
  );
});
