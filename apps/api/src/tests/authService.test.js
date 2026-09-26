import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns matching user id and token sub", async () => {
  const user = await registerUser({ email: "test@example.com", role: "client" });

  const decoded = verifyAccessToken(user.token);

  assert.equal(user.id, decoded.sub, "token sub must equal the returned user id");
});

test("registerUser id matches token sub even when system clock advances between calls (regression: #2845)", async () => {
  // Simulate the scenario where Date.now() returns different values on each call.
  // Before the fix, the id used one timestamp and the JWT sub used another,
  // causing a mismatch. After the fix, Date.now() is called only once and the
  // stored id is reused for the JWT sub claim.
  //
  // We mock Date.now() to return `base` for the FIRST call (used by registerUser
  // to generate the id) and a LATER timestamp for all subsequent calls (used
  // internally by jsonwebtoken to set iat/exp). Even with clock drift between
  // these calls, the id must match the token's sub because the fix stores the
  // id in a local variable.
  const originalDateNow = Date.now;
  const base = Date.now();
  let firstCall = true;

  Date.now = () => {
    if (firstCall) {
      firstCall = false;
      return base;
    }
    // Return a later time for JWT internal timestamps (iat/exp).
    // This simulates the clock advancing between the id generation and
    // the token signing that happened in the buggy version.
    return base + 50_000;
  };

  try {
    const user = await registerUser({ email: "test@example.com", role: "client" });
    const decoded = verifyAccessToken(user.token);

    // The id and sub both use the stored `id` variable, so they must match
    // even though Date.now() returned different values.
    assert.equal(user.id, decoded.sub, "token sub must match user id even if clock advances between calls");
    assert.equal(user.id, `usr_${base}`, "user id must use the first timestamp");
  } finally {
    Date.now = originalDateNow;
  }
});
