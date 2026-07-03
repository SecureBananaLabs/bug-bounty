import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

test("errorHandler returns 400 for Zod validation errors", () => {
  const schema = z.object({
    email: z.string().email()
  });

  let statusCode = null;
  let jsonPayload = null;

  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return payload;
    }
  };

  const err = schema.safeParse({ email: "not-an-email" }).error;
  errorHandler(err, {}, res, () => {
    throw new Error("next should not be called for ZodError");
  });

  assert.equal(statusCode, 400);
  assert.deepEqual(jsonPayload, {
    success: false,
    message: "Invalid request payload"
  });
});
