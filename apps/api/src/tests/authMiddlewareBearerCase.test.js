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

function runMiddleware(authorization) {
  const req = { headers: {} };
  if (authorization !== undefined) {
    req.headers.authorization = authorization;
  }
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { nextCalled, req, res };
}

test("authMiddleware accepts lowercase bearer auth scheme", () => {
  const token = signAccessToken({ sub: "usr_client", role: "client" });
  const result = runMiddleware(`bearer ${token}`);

  assert.equal(result.nextCalled, true);
  assert.equal(result.req.user.sub, "usr_client");
  assert.equal(result.req.user.role, "client");
});

test("authMiddleware accepts uppercase bearer auth scheme", () => {
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });
  const result = runMiddleware(`BEARER ${token}`);

  assert.equal(result.nextCalled, true);
  assert.equal(result.req.user.sub, "usr_admin");
  assert.equal(result.req.user.role, "admin");
});

test("authMiddleware rejects missing and malformed bearer credentials", () => {
  const missing = runMiddleware();
  const malformed = runMiddleware("Basic abc123");
  const blank = runMiddleware("Bearer ");

  assert.equal(missing.nextCalled, false);
  assert.equal(missing.res.statusCode, 401);
  assert.deepEqual(missing.res.payload, { success: false, message: "Unauthorized" });

  assert.equal(malformed.nextCalled, false);
  assert.equal(malformed.res.statusCode, 401);
  assert.deepEqual(malformed.res.payload, { success: false, message: "Unauthorized" });

  assert.equal(blank.nextCalled, false);
  assert.equal(blank.res.statusCode, 401);
  assert.deepEqual(blank.res.payload, { success: false, message: "Unauthorized" });
});
