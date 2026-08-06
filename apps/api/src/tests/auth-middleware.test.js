import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

function runMiddleware(authorization) {
  const req = { headers: {}, user: undefined };
  if (authorization !== undefined) {
    req.headers.authorization = authorization;
  }

  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  let calledNext = false;
  authMiddleware(req, res, () => {
    calledNext = true;
  });

  return { req, res, calledNext };
}

test("authMiddleware accepts canonical, lowercase, and uppercase bearer schemes", () => {
  const token = signAccessToken({ sub: "usr_case_test", role: "admin" });

  for (const scheme of ["Bearer", "bearer", "BEARER"]) {
    const { req, res, calledNext } = runMiddleware(`${scheme} ${token}`);

    assert.equal(calledNext, true);
    assert.equal(res.statusCode, 200);
    assert.equal(req.user.sub, "usr_case_test");
    assert.equal(req.user.role, "admin");
  }
});

test("authMiddleware rejects missing, blank, malformed, and invalid bearer tokens", () => {
  for (const authorization of [undefined, "", "Bearer", "Bearer   ", "Basic abc", "bearertoken"]) {
    const { res, calledNext } = runMiddleware(authorization);

    assert.equal(calledNext, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Unauthorized");
  }

  const invalid = runMiddleware("bearer not-a-valid-jwt");
  assert.equal(invalid.calledNext, false);
  assert.equal(invalid.res.statusCode, 401);
  assert.equal(invalid.res.body.message, "Invalid token");
});
