import test from "node:test";
import assert from "node:assert/strict";

import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

function createMockResponse() {
  return {
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

function runAuth(authorization) {
  const req = { headers: { authorization } };
  const res = createMockResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

for (const scheme of ["Bearer", "bearer", "BEARER"]) {
  test(`authMiddleware accepts ${scheme} bearer scheme`, () => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const { req, nextCalled } = runAuth(`${scheme} ${token}`);

    assert.equal(nextCalled, true);
    assert.equal(req.user.sub, "usr_test");
    assert.equal(req.user.role, "client");
  });
}

test("authMiddleware rejects malformed authorization headers", () => {
  const { res, nextCalled } = runAuth("Bearer");

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { success: false, message: "Unauthorized" });
});

test("authMiddleware rejects invalid tokens", () => {
  const { res, nextCalled } = runAuth("bearer not-a-token");

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { success: false, message: "Invalid token" });
});
