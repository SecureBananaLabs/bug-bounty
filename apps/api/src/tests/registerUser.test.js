import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser: user ID matches JWT subject", async () => {
  const result = await registerUser({ email: "test@example.com", role: "client" });
  
  // The user ID and JWT sub should match
  const decoded = verifyAccessToken(result.token);
  assert.equal(result.id, decoded.sub);
});

test("registerUser: returns consistent IDs across multiple calls", async () => {
  const result1 = await registerUser({ email: "a@test.com", role: "client" });
  const result2 = await registerUser({ email: "b@test.com", role: "client" });
  
  const decoded1 = verifyAccessToken(result1.token);
  const decoded2 = verifyAccessToken(result2.token);
  
  assert.equal(result1.id, decoded1.sub);
  assert.equal(result2.id, decoded2.sub);
});

test("registerUser: returns user with correct email and role", async () => {
  const result = await registerUser({ email: "owl@test.com", role: "admin" });
  assert.equal(result.email, "owl@test.com");
  assert.equal(result.role, "admin");
  
  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.role, "admin");
});
