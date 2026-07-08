import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponseRecorder() {
  return {
    headersSent: false,
    statusCode: 200,
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

test("errorHandler returns 400 for Zod validation errors", () => {
  const schema = z.object({
    title: z.string().min(4)
  });
  const res = createResponseRecorder();

  try {
    schema.parse({ title: "a" });
    assert.fail("Expected schema.parse to throw");
  } catch (error) {
    errorHandler(error, {}, res, () => {});
  }

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Invalid request payload"
  });
});

test("errorHandler keeps generic 500 response for non-validation errors", () => {
  const res = createResponseRecorder();

  errorHandler(new Error("boom"), {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: "Unexpected server error"
  });
});
