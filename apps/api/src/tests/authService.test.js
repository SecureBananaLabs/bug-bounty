import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the token for the same user id it returns", async () => {
  const realNow = Date.now;
  try {
    // Simulate the two Date.now() calls straddling a millisecond boundary:
    // calls alternate between T and T+1, so a double-call implementation
    // would sign the token for a different id than the one returned.
    const base = 1760000000000;
    let calls = 0;
    Date.now = () => base + (calls++ % 2);

    const result = await registerUser({ email: "a@example.com", role: "client" });

    assert.match(result.id, /^usr_\d+$/);

    // Verify while the clock is still stubbed so the token's expiry check
    // runs against the same mocked time it was signed with.
    const decoded = verifyAccessToken(result.token);
    assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, "client");
  } finally {
    Date.now = realNow;
  }
});

test("registerUser token decodes to the returned id under normal timing", async () => {
  const result = await registerUser({ email: "b@example.com", role: "freelancer" });

  assert.equal(result.email, "b@example.com");
  assert.equal(result.role, "freelancer");

  const decoded = jwt.decode(result.token);
  assert.equal(decoded.sub, result.id);
});
