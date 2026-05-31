import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { refreshToken } from "../services/authService.js";

const JWT_SECRET = "development-secret";

test("refreshToken accepts a valid token and returns a new one", () => {
  const oldToken = jwt.sign({ sub: "usr_123", role: "freelancer" }, JWT_SECRET, {
    expiresIn: "15m"
  });

  const result = refreshToken(oldToken);

  assert.ok(result.token, "should return a new token");

  const decoded = jwt.verify(result.token, JWT_SECRET);
  assert.equal(decoded.sub, "usr_123");
  assert.equal(decoded.role, "freelancer");
});

test("refreshToken throws on missing token", () => {
  assert.throws(() => refreshToken(undefined), /Refresh token is required/);
  assert.throws(() => refreshToken(""), /Refresh token is required/);
  assert.throws(() => refreshToken(null), /Refresh token is required/);
});

test("refreshToken throws on malformed token", () => {
  assert.throws(() => refreshToken("not-a-jwt"), /jwt malformed/);
});

test("refreshToken throws on expired token", () => {
  const expiredToken = jwt.sign(
    { sub: "usr_456", role: "client" },
    JWT_SECRET,
    { expiresIn: "-1h" }
  );

  assert.throws(() => refreshToken(expiredToken), /jwt expired/);
});

test("refreshToken preserves user role in new token", () => {
  const adminToken = jwt.sign({ sub: "usr_admin", role: "admin" }, JWT_SECRET, {
    expiresIn: "15m"
  });

  const result = refreshToken(adminToken);
  const decoded = jwt.verify(result.token, JWT_SECRET);

  assert.equal(decoded.sub, "usr_admin");
  assert.equal(decoded.role, "admin");
});

test("new token has later expiry than old token", () => {
  const oldToken = jwt.sign({ sub: "usr_789", role: "client" }, JWT_SECRET, {
    expiresIn: "1m"
  });

  const result = refreshToken(oldToken);

  const oldDecoded = jwt.decode(oldToken);
  const newDecoded = jwt.decode(result.token);

  assert.ok(newDecoded.exp > oldDecoded.exp, "new token should expire later");
});
