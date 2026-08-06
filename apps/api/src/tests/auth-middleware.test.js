import test from "node:test";
import assert from "node:assert/strict";
import { requireRole } from "../middleware/auth.js";

function createResponse() {
  return {
    body: null,
    statusCode: null,
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

test("requireRole allows users with the required role", () => {
  const req = { user: { role: "admin" } };
  const res = createResponse();
  let nextCalled = false;

  requireRole("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.equal(res.body, null);
});

test("requireRole rejects authenticated users without the required role", () => {
  const req = { user: { role: "client" } };
  const res = createResponse();
  let nextCalled = false;

  requireRole("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});

test("requireRole rejects requests without a user", () => {
  const req = {};
  const res = createResponse();
  let nextCalled = false;

  requireRole("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { success: false, message: "Forbidden" });
});
