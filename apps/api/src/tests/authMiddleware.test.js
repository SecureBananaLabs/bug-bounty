import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

function createResponse() {
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
    },
  };
}

test("authMiddleware accepts Bearer scheme case-insensitively", () => {
  const token = signAccessToken({ sub: "user_1" });

  for (const scheme of ["Bearer", "bearer", "BEARER"]) {
    const req = { headers: { authorization: `${scheme} ${token}` } };
    const res = createResponse();
    let nextCalled = false;

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.sub, "user_1");
    assert.equal(res.statusCode, undefined);
  }
});

test("authMiddleware still rejects non-Bearer schemes", () => {
  const req = { headers: { authorization: `Basic ${signAccessToken({ sub: "user_1" })}` } };
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { success: false, message: "Unauthorized" });
});
