import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createMockResponse({ headersSent = false } = {}) {
  return {
    headersSent,
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

test("errorHandler returns 400 for Zod validation errors", () => {
  const schema = z.object({ email: z.string().email() });
  const error = schema.safeParse({ email: "not-an-email" }).error;
  const res = createMockResponse();

  errorHandler(error, {}, res, assert.fail);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Invalid email"
  });
});

test("errorHandler returns 500 for generic errors", () => {
  const res = createMockResponse();
  const originalError = console.error;
  console.error = () => {};

  try {
    errorHandler(new Error("database unavailable"), {}, res, assert.fail);
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: "Unexpected server error"
  });
});

test("errorHandler delegates when headers were already sent", () => {
  const error = new Error("stream failed");
  const res = createMockResponse({ headersSent: true });

  errorHandler(error, {}, res, (receivedError) => {
    assert.equal(receivedError, error);
  });

  assert.equal(res.statusCode, undefined);
  assert.equal(res.body, undefined);
});
