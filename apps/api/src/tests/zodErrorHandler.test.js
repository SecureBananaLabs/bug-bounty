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
    },
  };
}

test("Zod validation failures return a structured 400 response", async () => {
  const schema = z.object({ email: z.string().email() });
  const result = schema.safeParse({ email: "not-an-email" });
  const response = createMockResponse();

  errorHandler(result.error, {}, response, () => {
    assert.fail("next should not be called when response headers are open");
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Invalid request payload",
  });
});
