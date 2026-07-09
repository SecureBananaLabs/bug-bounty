import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse() {
  return {
    headersSent: false,
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

test("errorHandler redacts raw errors in production logs", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalError = console.error;
  const calls = [];
  process.env.NODE_ENV = "production";
  console.error = (...args) => calls.push(args);

  try {
    const error = new Error("secret token: abc123");
    const res = createResponse();

    errorHandler(error, {}, res, () => {});

    assert.deepEqual(calls, [["Unhandled API error:", { name: "Error" }]]);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      success: false,
      message: "Unexpected server error"
    });
  } finally {
    process.env.NODE_ENV = originalEnv;
    console.error = originalError;
  }
});

test("errorHandler preserves raw error logging outside production", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalError = console.error;
  const calls = [];
  process.env.NODE_ENV = "development";
  console.error = (...args) => calls.push(args);

  try {
    const error = new Error("local debug detail");
    const res = createResponse();

    errorHandler(error, {}, res, () => {});

    assert.equal(calls[0][0], "Unhandled API error:");
    assert.equal(calls[0][1], error);
    assert.equal(res.statusCode, 500);
  } finally {
    process.env.NODE_ENV = originalEnv;
    console.error = originalError;
  }
});
