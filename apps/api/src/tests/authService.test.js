import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser uses the same user id for returned id and JWT subject even if time advances", async (t) => {
  let timestamp = 1_700_000_000_000;
  t.mock.method(Date, "now", () => timestamp++);

  const result = await registerUser({
    email: "new-user@example.com",
    role: "client",
  });
  const tokenPayload = verifyAccessToken(result.token);

  assert.equal(result.id, "usr_1700000000000");
  assert.equal(tokenPayload.sub, result.id);
  assert.equal(tokenPayload.role, "client");
  assert.equal(result.email, "new-user@example.com");
});

test("registerUser returns consistent user id and token sub under normal execution", async () => {
  const result = await registerUser({
    email: "consistent@example.com",
    role: "freelancer",
  });
  const tokenPayload = verifyAccessToken(result.token);

  assert.ok(result.id.startsWith("usr_"));
  assert.equal(tokenPayload.sub, result.id);
  assert.equal(tokenPayload.role, "freelancer");
});
