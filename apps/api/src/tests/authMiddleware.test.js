import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("authMiddleware accepts a lowercase bearer scheme", () => {
  const token = signAccessToken({ sub: "usr_1" });
  const req = { headers: { authorization: `bearer ${token}` } };
  const res = makeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(req.user.sub, "usr_1");
});

test("authMiddleware accepts an uppercase BEARER scheme", () => {
  const token = signAccessToken({ sub: "usr_2" });
  const req = { headers: { authorization: `BEARER ${token}` } };
  const res = makeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(req.user.sub, "usr_2");
});

test("authMiddleware accepts a mixed-case BeArEr scheme", () => {
  const token = signAccessToken({ sub: "usr_3" });
  const req = { headers: { authorization: `BeArEr ${token}` } };
  const res = makeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(req.user.sub, "usr_3");
});

test("authMiddleware rejects a missing Authorization header", () => {
  const req = { headers: {} };
  const res = makeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test("authMiddleware rejects a non-Bearer scheme", () => {
  const req = { headers: { authorization: "Basic dXNlcjpwYXNz" } };
  const res = makeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("authMiddleware rejects a malformed bearer with no token", () => {
  const req = { headers: { authorization: "Bearer" } };
  const res = makeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("authMiddleware rejects an invalid token", () => {
  const req = { headers: { authorization: "Bearer not-a-jwt" } };
  const res = makeRes();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid token");
});
