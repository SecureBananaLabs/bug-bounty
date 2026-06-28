import test from "node:test";
import assert from "node:assert/strict";
import { createRegisteredUser, registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("createRegisteredUser signs the supplied user id as the token subject", () => {
  const result = createRegisteredUser(
    {
      email: "person@example.com",
      password: "correct horse battery staple",
      role: "client"
    },
    "usr_test_id"
  );

  const decoded = verifyAccessToken(result.token);

  assert.equal(result.id, "usr_test_id");
  assert.equal(decoded.sub, result.id);
  assert.equal(decoded.role, result.role);
});

test("registerUser returns a collision-resistant prefixed user id", async () => {
  const first = await registerUser({
    email: "person@example.com",
    password: "correct horse battery staple",
    role: "client"
  });
  const second = await registerUser({
    email: "another@example.com",
    password: "correct horse battery staple",
    role: "client"
  });

  const decoded = verifyAccessToken(first.token);

  assert.match(first.id, /^usr_[0-9a-f-]{36}$/);
  assert.notEqual(first.id, second.id);
  assert.equal(decoded.sub, first.id);
});
