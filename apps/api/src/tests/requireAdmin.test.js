import test from "node:test";
import assert from "node:assert/strict";
import { requireAdmin } from "../middleware/requireAdmin.js";

function createMockResponse() {
  return {
    statusCode: undefined,
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
}

test("requireAdmin rejects missing authenticated user", () => {
  const res = createMockResponse();

  requireAdmin({}, res, assert.fail);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});

test("requireAdmin rejects non-admin users", () => {
  const res = createMockResponse();

  requireAdmin({ user: { sub: "usr_1", role: "client" } }, res, assert.fail);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});

test("requireAdmin allows admin users", () => {
  const res = createMockResponse();
  let called = false;

  requireAdmin({ user: { sub: "usr_admin", role: "admin" } }, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, undefined);
  assert.equal(res.body, undefined);
});
