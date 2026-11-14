import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "test-secret";

const { registerUser } = await import("../services/authService.js");
const { verifyAccessToken } = await import("../utils/jwt.js");

// Regression test for: "registerUser access token can reference a different
// user id". The service used to call Date.now() twice, so the returned user id
// and the token `sub` could disagree when the two calls landed in different
// milliseconds. The fix derives both from a single generated id.
test("registerUser token subject matches the returned user id", async () => {
  for (let i = 0; i < 50; i++) {
    const user = await registerUser({ email: "a@b.co", role: "freelancer" });

    assert.match(user.id, /^usr_\d+$/, "user id keeps its documented shape");

    const claims = verifyAccessToken(user.token);
    assert.equal(
      claims.sub,
      user.id,
      "token subject must equal the returned user id"
    );
    assert.equal(claims.role, "freelancer", "token keeps the requested role");
  }
});

test("registerUser role flows into the token", async () => {
  const user = await registerUser({ email: "client@b.co", role: "client" });
  assert.equal(verifyAccessToken(user.token).role, "client");
  assert.equal(user.role, "client");
});
