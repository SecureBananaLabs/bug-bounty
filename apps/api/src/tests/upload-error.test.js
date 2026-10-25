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

test("errorHandler returns 400 for unexpected upload file fields", () => {
  const res = createResponse();

  errorHandler({ code: "LIMIT_UNEXPECTED_FILE" }, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Unexpected file field"
  });
});

test("errorHandler keeps unknown errors as 500", () => {
  const res = createResponse();
  const originalError = console.error;
  console.error = () => {};

  try {
    errorHandler(new Error("boom"), {}, res, () => {});
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: "Unexpected server error"
  });
});
