import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("Registration User ID Mismatch Protection", async (t) => {
  // Stub Date.now to advance by 1 on every invocation
  const originalDateNow = Date.now;
  let count = 0;
  Date.now = () => {
    count += 1;
    return 1000 + count;
  };

  t.after(() => {
    Date.now = originalDateNow;
  });

  await t.test("registerUser aligns response id and signed token subject", async () => {
    const payload = {
      email: "test_mismatch@example.com",
      password: "password123",
      role: "client"
    };

    const result = await registerUser(payload);
    
    // Decode and verify the token sub
    const decoded = verifyAccessToken(result.token);
    
    assert.equal(result.id, decoded.sub, `Expected response ID (${result.id}) and token subject (${decoded.sub}) to match`);
  });
});
