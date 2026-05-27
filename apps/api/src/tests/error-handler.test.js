import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    headersSent: false,
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
    email: z.string().email()
  });
  const res = createMockResponse();

  try {
    schema.parse({ email: "not-an-email" });
  } catch (error) {
    errorHandler(error, {}, res, () => {});
  }

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Validation error");
  assert.deepEqual(res.body.errors, [
    {
      path: "email",
      message: "Invalid email",
      code: "invalid_string"
    }
  ]);
});

test("errorHandler keeps unknown errors as 500 responses", () => {
  const originalError = console.error;
  const res = createMockResponse();

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
