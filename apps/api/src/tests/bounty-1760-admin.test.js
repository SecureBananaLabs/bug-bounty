import test from "node:test";
import assert from "node:assert/strict";

test("requireAdmin passes for admin role", async () => {
  const { requireAdmin } = await import("../middleware/auth.js");
  let nextCalled = false;
  const req = { user: { role: "admin" } };
  const res = {};
  const next = () => { nextCalled = true; };
  requireAdmin(req, res, next);
  assert.equal(nextCalled, true);
});

test("requireAdmin rejects client role with 403", async () => {
  const { requireAdmin } = await import("../middleware/auth.js");
  let statusCode = null;
  let body = null;
  const req = { user: { role: "client" } };
  const res = {
    status(code) { statusCode = code; return res; },
    json(data) { body = data; return res; }
  };
  const next = () => { throw new Error("next should not be called"); };
  requireAdmin(req, res, next);
  assert.equal(statusCode, 403);
  assert.equal(body.success, false);
});

test("requireAdmin rejects freelancer role with 403", async () => {
  const { requireAdmin } = await import("../middleware/auth.js");
  let statusCode = null;
  const req = { user: { role: "freelancer" } };
  const res = {
    status(code) { statusCode = code; return res; },
    json() { return res; }
  };
  const next = () => { throw new Error("next should not be called"); };
  requireAdmin(req, res, next);
  assert.equal(statusCode, 403);
});
