import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse() {
  return {
    headersSent: false,
    statusCode: 0,
    body: null,
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

test("errorHandler returns 400 for ZodError-like failures", () => {
  const res = createResponse();
  const err = { name: "ZodError" };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Invalid request"
  });
});

test("errorHandler returns 500 for unknown errors", () => {
  const res = createResponse();
  const err = new Error("boom");
  const originalError = console.error;
  console.error = () => {};

  try {
    errorHandler(err, {}, res, () => {});
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: "Unexpected server error"
  });
});
