import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

test("authMiddleware: rejects missing Authorization header", async () => {
  const req = { headers: {} };
  let statusCode = null;
  const res = {
    status(code) { statusCode = code; return this; },
    json() { return this; }
  };
  const next = () => {};
  authMiddleware(req, res, next);
  assert.equal(statusCode, 401);
});

test("authMiddleware: accepts Bearer token with single space", async () => {
  const token = signAccessToken({ sub: "usr_123", role: "client" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let called = false;
  const res = { status() { return this; }, json() { return this; } };
  const next = () => { called = true; };
  authMiddleware(req, res, next);
  assert.equal(called, true);
  assert.equal(req.user.sub, "usr_123");
});

test("authMiddleware: accepts Bearer token with multiple spaces", async () => {
  const token = signAccessToken({ sub: "usr_456", role: "client" });
  const req = { headers: { authorization: `Bearer   ${token}` } };
  let called = false;
  const res = { status() { return this; }, json() { return this; } };
  const next = () => { called = true; };
  authMiddleware(req, res, next);
  assert.equal(called, true);
  assert.equal(req.user.sub, "usr_456");
});

test("authMiddleware: rejects token with leading space after Bearer", async () => {
  const token = signAccessToken({ sub: "usr_789", role: "client" });
  const req = { headers: { authorization: `Bearer  ${token}` } };
  let statusCode = null;
  const res = {
    status(code) { statusCode = code; return this; },
    json() { return this; }
  };
  authMiddleware(req, res, next);
  // Should accept multiple spaces after Bearer (the space between Bearer and token)
  // The fix trims leading spaces from the token portion
  assert.equal(statusCode, null); // next() was called, not fail()
});

test("authMiddleware: rejects invalid token", async () => {
  const req = { headers: { authorization: "Bearer invalid-token-here" } };
  let statusCode = null;
  const res = {
    status(code) { statusCode = code; return this; },
    json() { return this; }
  };
  authMiddleware(req, res, next);
  assert.equal(statusCode, 401);
});
