import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("access tokens are signed and verified with HS256", () => {
  const token = signAccessToken({ sub: "usr_1", role: "client" });
  const decoded = jwt.decode(token, { complete: true });

  assert.equal(decoded.header.alg, "HS256");
  assert.equal(verifyAccessToken(token).sub, "usr_1");
});

test("access token verification rejects unexpected HMAC algorithms", () => {
  const token = jwt.sign({ sub: "usr_1", role: "client" }, env.jwtSecret, {
    algorithm: "HS512",
    expiresIn: "15m"
  });

  assert.throws(
    () => verifyAccessToken(token),
    /invalid algorithm/
  );
});
