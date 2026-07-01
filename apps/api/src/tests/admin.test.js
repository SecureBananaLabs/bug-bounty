import test from "node:test";
import assert from "node:assert/strict";
import { adminRequired } from "../middleware/admin.js";

test("adminRequired middleware blocks missing user or non-ADMIN roles", () => {
  let nextCalled = false;
  let statusSet = 400;
  let responseData = null;

  const req = {};
  const res = {
    status(s) {
      statusSet = s;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };
  const next = () => {
    nextCalled = true;
  };

  // Case 1: req.user is undefined
  adminRequired(req, res, next);
  assert.equal(nextCalled, false);
  assert.equal(statusSet, 403);
  assert.equal(responseData.success, false);
  assert.equal(responseData.message, "Forbidden: Admin role required");

  // Reset values
  nextCalled = false;
  statusSet = 400;
  responseData = null;

  // Case 2: req.user exists but is CLIENT role
  req.user = { sub: "usr_123", role: "CLIENT" };
  adminRequired(req, res, next);
  assert.equal(nextCalled, false);
  assert.equal(statusSet, 403);
  assert.equal(responseData.success, false);
  assert.equal(responseData.message, "Forbidden: Admin role required");

  // Reset values
  nextCalled = false;
  statusSet = 400;
  responseData = null;

  // Case 3: req.user exists and is ADMIN role
  req.user = { sub: "usr_admin", role: "ADMIN" };
  adminRequired(req, res, next);
  assert.equal(nextCalled, true);
  assert.equal(statusSet, 400); // unaffected
  assert.equal(responseData, null); // unaffected
});
