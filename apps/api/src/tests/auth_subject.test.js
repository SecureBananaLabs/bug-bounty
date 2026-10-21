import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser ensures decoded token subject matches returned user id", async () => {
  const payload = {
    email: "user_test@example.com",
    role: "client"
  };

  const result = await registerUser(payload);

  assert.ok(result.id, "Expected result to contain user id");
  assert.ok(result.token, "Expected result to contain access token");
  assert.equal(result.email, payload.email);

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id, "Token sub claim must match returned user id exactly");
  assert.equal(decoded.role, result.role, "Token role claim must match user role");
});

test("consecutive registrations generate unique ids where each sub matches returned id", async () => {
  const user1 = await registerUser({ email: "user1@example.com", role: "freelancer" });
  const user2 = await registerUser({ email: "user2@example.com", role: "client" });

  const decoded1 = verifyAccessToken(user1.token);
  const decoded2 = verifyAccessToken(user2.token);

  assert.equal(decoded1.sub, user1.id);
  assert.equal(decoded2.sub, user2.id);
});
