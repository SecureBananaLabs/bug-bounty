import test from "node:test";
import assert from "node:assert/strict";
import { requireAdmin } from "../middleware/requireAdmin.js";

function createResponse() {
  const res = {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
}

test("requireAdmin rejects missing users", () => {
  const res = createResponse();
  let nextCalled = false;

  requireAdmin({}, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});

test("requireAdmin rejects non-admin users", () => {
  const res = createResponse();
  let nextCalled = false;

  requireAdmin({ user: { role: "client" } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});

test("requireAdmin allows admin users", () => {
  const res = createResponse();
  let nextCalled = false;

  requireAdmin({ user: { role: "admin" } }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
  assert.equal(res.body, undefined);
});
