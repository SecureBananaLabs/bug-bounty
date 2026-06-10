import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

function runAuth(authorization) {
  const req = { headers: { authorization } };
  let statusCode;
  let payload;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return body;
    }
  };

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { req, statusCode, payload, nextCalled };
}

test("authMiddleware accepts Bearer scheme case-insensitively", () => {
  const token = signAccessToken({ sub: "user_123" });

  for (const scheme of ["Bearer", "bearer", "BEARER"]) {
    const result = runAuth(`${scheme} ${token}`);

    assert.equal(result.nextCalled, true);
    assert.equal(result.req.user.sub, "user_123");
  }
});

test("authMiddleware rejects non-Bearer schemes", () => {
  const token = signAccessToken({ sub: "user_123" });
  const result = runAuth(`Basic ${token}`);

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.payload, { success: false, message: "Unauthorized" });
});
