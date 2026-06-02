import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";

function createEnv(value) {
  return { nodeEnv: value };
}

test("production mode logs only name and message", async () => {
  const logs = [];
  const originalWarn = console.error;
  console.error = (...args) => logs.push(args);

  try {
    const err = new Error("sensitive stack trace");
    err.name = "SensitiveError";
    const req = {};
    const res = {
      headersSent: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    const next = () => {};

    errorHandler.call({ env: createEnv("production") }, err, req, res, next);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { success: false, message: "Unexpected server error" });

    const [label, payload] = logs[logs.length - 1];
    assert.equal(label, "Unhandled API error:");
    assert.deepEqual(payload, { name: "SensitiveError", message: "sensitive stack trace" });
  } finally {
    console.error = originalWarn;
  }
});

test("development mode logs raw error object", async () => {
  const logs = [];
  const originalWarn = console.error;
  console.error = (...args) => logs.push(args);

  try {
    const err = new Error("raw error");
    const req = {};
    const res = {
      headersSent: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    const next = () => {};

    errorHandler.call({ env: createEnv("development") }, err, req, res, next);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { success: false, message: "Unexpected server error" });

    const [label, payload] = logs[logs.length - 1];
    assert.equal(label, "Unhandled API error:");
    assert.equal(payload, err);
  } finally {
    console.error = originalWarn;
  }
});

test("skips response when headers already sent", async () => {
  let calledNext = false;
  const err = new Error("headers sent");
  const req = {};
  const res = {
    headersSent: true,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const next = (error) => {
    calledNext = true;
    assert.equal(error, err);
  };

  errorHandler.call({ env: createEnv("production") }, err, req, res, next);

  assert.equal(calledNext, true);
});
