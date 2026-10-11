import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";

test("registerUser uses the identical user ID for return object and signed JWT subject", async () => {
  const originalDateNow = Date.now;
  let counter = 0;
  // Mock Date.now to increment on each call to expose timestamp race conditions
  Date.now = () => {
    counter += 1;
    return 1700000000000 + counter * 50;
  };

  try {
    const res = await registerUser({
      email: "dev@example.com",
      role: "contributor"
    });

    assert.ok(res.id.startsWith("usr_"), "id must start with usr_");
    assert.ok(res.token, "token must be generated");

    // Decode JWT payload without external library
    const tokenParts = res.token.split(".");
    assert.equal(tokenParts.length, 3, "JWT must have 3 parts");
    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64url").toString("utf-8"));

    assert.equal(payload.sub, res.id, "JWT subject (sub) must strictly match user id");
    assert.equal(payload.role, "contributor", "JWT role must match requested role");
  } finally {
    Date.now = originalDateNow;
  }
});
