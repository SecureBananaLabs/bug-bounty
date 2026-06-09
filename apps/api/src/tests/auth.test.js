import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

// Helper to construct mock res
function mockResponse() {
  const res = {
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    },
  };
  return res;
}

test("authMiddleware - allows valid client token", () => {
  const token = signAccessToken({ sub: "usr_client1", role: "client" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(nextCalled);
  assert.equal(req.user.sub, "usr_client1");
  assert.equal(req.user.role, "client");
});

test("authMiddleware - allows valid freelancer token", () => {
  const token = signAccessToken({ sub: "usr_freelance1", role: "freelancer" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(nextCalled);
  assert.equal(req.user.role, "freelancer");
});

test("authMiddleware - allows valid admin token", () => {
  const token = signAccessToken({ sub: "usr_admin1", role: "admin" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(nextCalled);
  assert.equal(req.user.role, "admin");
});

test("authMiddleware - rejects token signed with string payload instead of object", () => {
  const token = jwt.sign("just-a-string-payload", env.jwtSecret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(!nextCalled);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test("authMiddleware - rejects token missing sub", () => {
  const token = signAccessToken({ role: "client" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(!nextCalled);
  assert.equal(res.statusCode, 401);
});

test("authMiddleware - rejects token with empty sub", () => {
  const token = signAccessToken({ sub: "   ", role: "client" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(!nextCalled);
  assert.equal(res.statusCode, 401);
});

test("authMiddleware - rejects token with unsupported role", () => {
  const token = signAccessToken({ sub: "usr_client1", role: "super_admin" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(!nextCalled);
  assert.equal(res.statusCode, 401);
});

test("authMiddleware - rejects invalid Bearer header format", () => {
  const req = { headers: { authorization: "invalid_format_without_bearer" } };
  const res = mockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.ok(!nextCalled);
  assert.equal(res.statusCode, 401);
});
