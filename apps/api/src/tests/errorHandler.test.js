import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";
import { ZodError } from "zod";

test("errorHandler returns 400 for Zod validation errors", async () => {
  const err = new ZodError([
    {
      code: "too_small",
      minimum: 1,
      type: "string",
      inclusive: true,
      message: "String must contain at least 1 character(s)",
      path: ["password"],
    },
  ]);

  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (body) {
      this.body = body;
      return this;
    },
    headersSent: false,
  };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Validation error");
  assert.ok(Array.isArray(res.body.errors));
  assert.equal(res.body.errors.length, 1);
});

test("errorHandler returns 500 for other errors", async () => {
  const err = new Error("Database connection failed");

  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (body) {
      this.body = body;
      return this;
    },
    headersSent: false,
  };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Unexpected server error");
});

test("errorHandler calls next if headers already sent", async () => {
  const err = new Error("Some error");
  const next = test.mock.fn();

  const res = {
    headersSent: true,
  };

  errorHandler(err, {}, res, next);

  assert.strictEqual(next.mock.calls.length, 1);
  assert.strictEqual(next.mock.calls[0].arguments[0], err);
});