import { test } from "node:test";
import assert from "node:assert";
import { adminMiddleware } from "../middleware/admin.js";

test("adminMiddleware (Unit)", async (t) => {
  await t.test("should call next if user is admin", () => {
    let calledNext = false;
    const req = { user: { role: "ADMIN" } };
    const res = {};
    const next = () => { calledNext = true; };

    adminMiddleware(req, res, next);
    assert.strictEqual(calledNext, true);
  });

  await t.test("should return 403 if user is not admin", () => {
    let statusCode = null;
    let jsonResult = null;
    const req = { user: { role: "CLIENT" } };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      }
    };
    const next = () => { throw new Error("Should not be called"); };

    adminMiddleware(req, res, next);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonResult.success, false);
    assert.match(jsonResult.message, /Forbidden/);
  });

  await t.test("should return 403 if user is not authenticated", () => {
    let statusCode = null;
    let jsonResult = null;
    const req = {};
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      }
    };
    const next = () => { throw new Error("Should not be called"); };

    adminMiddleware(req, res, next);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonResult.success, false);
    assert.match(jsonResult.message, /Forbidden/);
  });
});
