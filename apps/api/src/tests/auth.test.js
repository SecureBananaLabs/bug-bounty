import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

test("authMiddleware - case insensitive Bearer scheme parsing", async () => {
  const token = signAccessToken({ userId: "123", role: "user" });

  const testCases = [
    `Bearer ${token}`,
    `bearer ${token}`,
    `BEARER ${token}`,
  ];

  for (const authHeader of testCases) {
    let nextCalled = false;
    const req = {
      headers: {
        authorization: authHeader
      }
    };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware(req, res, next);

    assert.ok(nextCalled, `Failed for header: ${authHeader}`);
    assert.equal(req.user.userId, "123");
  }
});

test("authMiddleware - rejects invalid schemas or tokens", async () => {
  const testCases = [
    "Basic 12345",
    "Bearer",
    "",
    null,
    "bearerInvalidToken",
  ];

  for (const authHeader of testCases) {
    let nextCalled = false;
    const req = {
      headers: {
        authorization: authHeader
      }
    };
    let jsonCalled = false;
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        jsonCalled = true;
        this.body = data;
        return this;
      }
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware(req, res, next);

    assert.ok(!nextCalled, `Next should not be called for: ${authHeader}`);
    assert.ok(jsonCalled);
    assert.equal(res.statusCode, 401);
  }
});
