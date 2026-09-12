import test from "node:test";
import assert from "node:assert/strict";
import { ZodError, z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse() {
  return {
    body: null,
    statusCode: null,
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
  const result = z.object({ email: z.string().email() }).safeParse({ email: "invalid" });
  assert.equal(result.success, false);

  const res = createResponse();
  let nextCalled = false;

  errorHandler(result.error, {}, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Validation failed");
  assert.equal(Array.isArray(res.body.issues), true);
});

test("errorHandler delegates when headers were already sent", () => {
  const res = createResponse();
  res.headersSent = true;
  const error = new ZodError([]);
  let nextError = null;

  errorHandler(error, {}, res, (err) => {
    nextError = err;
  });

  assert.equal(nextError, error);
  assert.equal(res.statusCode, null);
  assert.equal(res.body, null);
});
