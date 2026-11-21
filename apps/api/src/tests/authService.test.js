import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

function withTickingClock(fn) {
  const original = Date.now;
  let tick = 1_700_000_000_000;
  Date.now = () => (tick += 1_000);
  return Promise.resolve()
    .then(fn)
    .finally(() => { Date.now = original; });
}

test("registerUser subject matches returned id when the clock advances", () =>
  withTickingClock(async () => {
    const user = await registerUser({ email: "nova@example.com", role: "client" });
    const claims = verifyAccessToken(user.token);
    assert.equal(claims.sub, user.id);
    assert.equal(claims.role, "client");
  }));

test("registerUser returns a distinct id per registration", () =>
  withTickingClock(async () => {
    const first = await registerUser({ email: "a@example.com", role: "client" });
    const second = await registerUser({ email: "b@example.com", role: "freelancer" });
    assert.notEqual(first.id, second.id);
    assert.equal(verifyAccessToken(second.token).sub, second.id);
  }));
