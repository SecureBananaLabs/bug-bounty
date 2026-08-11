import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse() {
  return {
    headersSent: false,
    statusCode: undefined,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

async function withConsoleErrorSpy(fn) {
  const originalConsoleError = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);

  try {
    await fn(calls);
  } finally {
    console.error = originalConsoleError;
  }
}

test("production error logging avoids raw error serialization", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const error = new Error("secret-token-value");
  const res = createResponse();

  try {
    await withConsoleErrorSpy(async (calls) => {
      errorHandler(error, {}, res, () => {});

      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], "Unhandled API error:");
      assert.notEqual(calls[0][1], error);
      assert.deepEqual(calls[0][1], { name: "Error", statusCode: 500 });
      assert.equal(JSON.stringify(calls[0]).includes("secret-token-value"), false);
      assert.equal(JSON.stringify(calls[0]).includes("at "), false);
      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.payload, {
        success: false,
        message: "Unexpected server error"
      });
    });
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
});

test("non-production error logging keeps the raw error for debugging", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  const error = new Error("local debug detail");
  const res = createResponse();

  try {
    await withConsoleErrorSpy(async (calls) => {
      errorHandler(error, {}, res, () => {});

      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], "Unhandled API error:");
      assert.equal(calls[0][1], error);
      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.payload, {
        success: false,
        message: "Unexpected server error"
      });
    });
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
});
