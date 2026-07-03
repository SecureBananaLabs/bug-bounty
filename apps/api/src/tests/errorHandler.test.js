import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponseRecorder() {
  const response = {
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

  return response;
}

test("errorHandler returns 400 for Zod validation errors", () => {
  const response = createResponseRecorder();
  const zodError = new ZodError([
    {
      code: "invalid_type",
      expected: "string",
      received: "number",
      path: ["email"],
      message: "Expected string, received number"
    }
  ]);

  errorHandler(zodError, {}, response, () => {
    throw new Error("next should not be called");
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Invalid request payload"
  });
});
