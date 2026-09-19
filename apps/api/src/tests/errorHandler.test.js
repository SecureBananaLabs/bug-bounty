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

function withConsoleErrorSpy(callback) {
  const original = console.error;
  const calls = [];
  console.error = (...args) => {
    calls.push(args);
  };

  try {
    callback(calls);
  } finally {
    console.error = original;
  }
}

test("production error logging does not serialize raw error details", () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const error = new Error("database password secret-token leaked");
    error.stack = "stack with secret-token";
    const res = createResponse();

    withConsoleErrorSpy((calls) => {
      errorHandler(error, {}, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.body, {
        success: false,
        message: "Unexpected server error"
      });

      assert.equal(calls.length, 1);
      assert.notEqual(calls[0][1], error);
      assert.doesNotMatch(JSON.stringify(calls[0]), /secret-token|database password/);
    });
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test("development error logging preserves the raw error object", () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  try {
    const error = new Error("local debugging detail");
    const res = createResponse();

    withConsoleErrorSpy((calls) => {
      errorHandler(error, {}, res, () => {});

      assert.equal(calls.length, 1);
      assert.equal(calls[0][1], error);
    });
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});
