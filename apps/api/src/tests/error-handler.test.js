import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponseMock() {
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
    name: z.string().min(1)
  });
  const parse = schema.safeParse({ name: "" });
  assert.equal(parse.success, false);

  const res = createResponseMock();
  errorHandler(parse.error, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});
