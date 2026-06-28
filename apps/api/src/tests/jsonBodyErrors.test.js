import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";

function createJsonResponse() {
  return {
    headersSent: false,
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("malformed JSON request bodies return 400", async () => {
  const error = new SyntaxError("Unexpected end of JSON input");
  error.type = "entity.parse.failed";
  const response = createJsonResponse();

  errorHandler(error, {}, response, () => {
    throw new Error("next should not be called for malformed JSON");
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Malformed JSON request body"
  });
});
