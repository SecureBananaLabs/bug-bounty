import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function runAuth(payload) {
  const token = signAccessToken(payload);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

test("authMiddleware accepts valid identity claims", () => {
  const result = runAuth({ sub: "usr_123", role: "client" });
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.user.sub, "usr_123");
  assert.equal(result.req.user.role, "client");
});

test("authMiddleware rejects a token missing sub", () => {
  const result = runAuth({ role: "client" });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
  assert.deepEqual(result.res.body, { success: false, message: "Invalid token" });
});

test("authMiddleware rejects a blank sub", () => {
  const result = runAuth({ sub: "   ", role: "client" });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
});

test("authMiddleware rejects an unknown role", () => {
  const result = runAuth({ sub: "usr_123", role: "owner" });
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
});
