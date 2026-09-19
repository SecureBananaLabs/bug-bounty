import test from "node:test";
import assert from "node:assert/strict";
import { requireRole } from "../middleware/auth.js";

function createResponse() {
  return {
    statusCode: null,
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

test("requireRole blocks authenticated users without the required role", () => {
  const req = { user: { sub: "usr_client", role: "client" } };
  const res = createResponse();
  let nextCalled = false;

  requireRole("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});

test("requireRole allows authenticated admins", () => {
  const req = { user: { sub: "usr_admin", role: "admin" } };
  const res = createResponse();
  let nextCalled = false;

  requireRole("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.equal(res.body, null);
});
