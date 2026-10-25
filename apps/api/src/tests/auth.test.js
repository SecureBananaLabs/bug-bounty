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
    }
  };
}

async function runAuthHeader(header) {
  const req = { headers: { authorization: header } };
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

test("authMiddleware accepts case-insensitive bearer schemes", async () => {
  const token = signAccessToken({ sub: "user_1" });

  for (const scheme of ["Bearer", "bearer", "BEARER"]) {
    const { req, nextCalled } = await runAuthHeader(`${scheme} ${token}`);

    assert.equal(nextCalled, true);
    assert.equal(req.user.sub, "user_1");
  }
});

test("authMiddleware rejects missing, blank, and malformed authorization headers", async () => {
  for (const header of [undefined, "Bearer ", "bearer    ", "Basic token"]) {
    const { res, nextCalled } = await runAuthHeader(header);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.payload, { success: false, message: "Unauthorized" });
  }
});