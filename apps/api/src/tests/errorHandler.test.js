import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../config/env.js";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse() {
  return {
    headersSent: false,
    statusCode: 200,
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

test("production error logs omit raw secret-bearing error messages", () => {
  const originalNodeEnv = env.nodeEnv;
  const originalConsoleError = console.error;
  const calls = [];

  env.nodeEnv = "production";
  console.error = (...args) => calls.push(args);

  try {
    const res = createResponse();
    const secret = "sk_live_hidden_token";
    const err = new Error(`database auth failed for ${secret}`);

    errorHandler(err, {}, res, () => assert.fail("next should not be called"));

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      success: false,
      message: "Unexpected server error"
    });

    const serializedLogs = JSON.stringify(calls);
    assert.equal(serializedLogs.includes(secret), false);
    assert.equal(serializedLogs.includes("database auth failed"), false);
    assert.match(serializedLogs, /"name":"Error"/);
    assert.match(serializedLogs, /"status":500/);
  } finally {
    env.nodeEnv = originalNodeEnv;
    console.error = originalConsoleError;
  }
});
