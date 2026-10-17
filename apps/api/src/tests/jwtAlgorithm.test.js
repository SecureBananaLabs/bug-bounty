import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

function headerOf(token) {
  return jwt.decode(token, { complete: true }).header.alg;
}

test("signs and verifies application tokens with HS256", () => {
  const token = signAccessToken({ sub: "usr_test", role: "client" });
  assert.equal(headerOf(token), "HS256");

  const decoded = verifyAccessToken(token);
  assert.equal(decoded.sub, "usr_test");
  assert.equal(decoded.role, "client");
});

test("rejects an HS512 token signed with the same secret", () => {
  const token = jwt.sign({ sub: "usr_test" }, env.jwtSecret, {
    algorithm: "HS512"
  });

  assert.equal(headerOf(token), "HS512");
  assert.throws(() => verifyAccessToken(token));
});
