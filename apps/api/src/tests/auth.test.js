import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";

const SECRET = "development-secret";

function makeToken(payload = { id: 1, role: "client" }) {
  return jwt.sign(payload, SECRET, { expiresIn: "15m" });
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

test("accepts canonical Bearer scheme", () => {
  const token = makeToken();
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  let nextCalled = false;
  authMiddleware(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.ok(req.user);
  assert.equal(req.user.id, 1);
});

test("accepts lowercase bearer scheme", () => {
  const token = makeToken();
  const req = { headers: { authorization: `bearer ${token}` } };
  const res = mockRes();
  let nextCalled = false;
  authMiddleware(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.ok(req.user);
});

test("accepts UPPERCASE BEARER scheme", () => {
  const token = makeToken();
  const req = { headers: { authorization: `BEARER ${token}` } };
  const res = mockRes();
  let nextCalled = false;
  authMiddleware(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.ok(req.user);
});

test("accepts MiXeD CaSe bearer scheme", () => {
  const token = makeToken();
  const req = { headers: { authorization: `BeArEr ${token}` } };
  const res = mockRes();
  let nextCalled = false;
  authMiddleware(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
});

test("rejects missing Authorization header with 401", () => {
  const req = { headers: {} };
  const res = mockRes();
  authMiddleware(req, res, () => { assert.fail("next should not be called"); });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test("rejects malformed scheme (Basic) with 401", () => {
  const req = { headers: { authorization: "Basic dXNlcjpwYXNz" } };
  const res = mockRes();
  authMiddleware(req, res, () => { assert.fail("next should not be called"); });
  assert.equal(res.statusCode, 401);
});

test("rejects blank Authorization with 401", () => {
  const req = { headers: { authorization: "" } };
  const res = mockRes();
  authMiddleware(req, res, () => { assert.fail("next should not be called"); });
  assert.equal(res.statusCode, 401);
});

test("rejects invalid token with 401", () => {
  const req = { headers: { authorization: "Bearer not-a-real-token" } };
  const res = mockRes();
  authMiddleware(req, res, () => { assert.fail("next should not be called"); });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid token");
});
