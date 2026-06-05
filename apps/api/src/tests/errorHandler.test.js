import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse(headersSent = false) {
  return {
    body: undefined,
    headersSent,
    statusCode: undefined,
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

test("errorHandler returns 400 with the first Zod validation message", () => {
  const schema = z.object({
    email: z.string().email("email must be valid")
  });
  const result = schema.safeParse({ email: "not-an-email" });
  const res = createResponse();
  let forwardedError;

  assert.equal(result.success, false);

  errorHandler(result.error, {}, res, (err) => {
    forwardedError = err;
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "email must be valid"
  });
  assert.equal(forwardedError, undefined);
});

test("errorHandler keeps generic errors as 500 responses", () => {
  const res = createResponse();
  const originalError = console.error;

  console.error = () => {};
  try {
    errorHandler(new Error("database unavailable"), {}, res, () => {});
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: "Unexpected server error"
  });
});

test("errorHandler forwards errors after headers have been sent", () => {
  const err = new Error("stream failed");
  const res = createResponse(true);
  let forwardedError;

  errorHandler(err, {}, res, (nextErr) => {
    forwardedError = nextErr;
  });

  assert.equal(forwardedError, err);
  assert.equal(res.statusCode, undefined);
  assert.equal(res.body, undefined);
});
