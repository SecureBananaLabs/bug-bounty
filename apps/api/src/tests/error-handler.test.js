import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createMockResponse() {
  return {
    statusCode: undefined,
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

test("Zod validation errors return a 400 validation response", () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });
  const result = schema.safeParse({
    email: "not-an-email",
    password: "short"
  });
  assert.equal(result.success, false);

  const res = createMockResponse();
  errorHandler(result.error, {}, res, () => {
    throw new Error("next should not be called for ZodError");
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Validation failed");
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
});
