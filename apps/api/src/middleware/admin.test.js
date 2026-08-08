import { test } from "node:test";
import assert from "node:assert/strict";
import { adminMiddleware } from "./auth.js";

test("adminMiddleware returns 403 Forbidden for non-admin user role", () => {
  let statusCode = 0;
  let responseData = null;
  let nextCalled = false;

  const req = { user: { role: "client" } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };
  const next = () => { nextCalled = true; };

  adminMiddleware(req, res, next);

  assert.equal(statusCode, 403, "Status code must be 403 Forbidden");
  assert.equal(nextCalled, false, "next() must not be called when role is not admin");
});

test("adminMiddleware calls next() for user with admin role", () => {
  let nextCalled = false;
  const req = { user: { role: "admin" } };
  const res = {};
  const next = () => { nextCalled = true; };

  adminMiddleware(req, res, next);
  assert.equal(nextCalled, true, "next() must be called for admin role");
});
