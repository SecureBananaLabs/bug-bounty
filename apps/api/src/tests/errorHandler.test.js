import test from "node:test";
import assert from "node:assert/strict";
import { ZodError, z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse() {
  return {
    headersSent: false,
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test("Zod validation errors return 400 response", () => {
  const schema = z.object({
    email: z.string().email()
  });
  let error;

  try {
    schema.parse({ email: "notanemail" });
  } catch (err) {
    error = err;
  }

  assert.ok(error instanceof ZodError);
  const response = createResponse();
  errorHandler(error, {}, response, assert.fail);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.payload, {
    success: false,
    message: "Invalid email"
  });
});
