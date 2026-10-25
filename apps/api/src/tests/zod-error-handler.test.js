import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

test("errorHandler returns 400 for Zod validation errors", () => {
  let statusCode;
  let responseBody;

  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return body;
    }
  };

  errorHandler(
    new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["email"],
        message: "Required"
      }
    ]),
    {},
    res,
    () => {}
  );

  assert.equal(statusCode, 400);
  assert.deepEqual(responseBody, {
    success: false,
    message: "Validation failed"
  });
});
