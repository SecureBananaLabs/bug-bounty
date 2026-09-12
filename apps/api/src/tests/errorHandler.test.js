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

async function withNodeEnv(value, run) {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = value;

  try {
    await run();
  } finally {
    if (original === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = original;
    }
  }
}

async function captureConsoleError(run) {
  const original = console.error;
  const calls = [];
  console.error = (...args) => {
    calls.push(args);
  };

  try {
    await run(calls);
  } finally {
    console.error = original;
  }
}

test("production error logging redacts raw error messages", async () => {
  await withNodeEnv("production", async () => {
    await captureConsoleError((calls) => {
      const err = new Error("leaked token=super-secret-value");
      const res = createResponse();

      errorHandler(err, {}, res, () => assert.fail("next should not be called"));

      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.body, {
        success: false,
        message: "Unexpected server error"
      });

      const serializedLog = JSON.stringify(calls);
      assert.equal(calls[0][0], "Unhandled API error:");
      assert.deepEqual(calls[0][1], { name: "Error" });
      assert.equal(serializedLog.includes("super-secret-value"), false);
      assert.equal(serializedLog.includes("token="), false);
    });
  });
});

test("development error logging keeps raw errors for debugging", async () => {
  await withNodeEnv("development", async () => {
    await captureConsoleError((calls) => {
      const err = new Error("developer-visible detail");
      const res = createResponse();

      errorHandler(err, {}, res, () => assert.fail("next should not be called"));

      assert.equal(calls[0][0], "Unhandled API error:");
      assert.equal(calls[0][1], err);
      assert.equal(res.statusCode, 500);
    });
  });
});
