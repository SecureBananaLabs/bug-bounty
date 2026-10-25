import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser returns an id that matches the token subject", async () => {
  const result = await registerUser({
    email: "new@example.com",
    password: "supersecret",
    role: "client"
  });

  const claims = verifyAccessToken(result.token);

  assert.equal(claims.sub, result.id);
  assert.equal(claims.role, result.role);
  assert.match(result.id, /^usr_\d+$/);
});

test("registerUser keeps id and token subject in sync under rapid calls", async () => {
  const results = await Promise.all(
    Array.from({ length: 25 }, (_, i) =>
      registerUser({
        email: `user${i}@example.com`,
        password: "supersecret",
        role: "freelancer"
      })
    )
  );

  for (const result of results) {
    const claims = verifyAccessToken(result.token);
    assert.equal(claims.sub, result.id);
  }
});
