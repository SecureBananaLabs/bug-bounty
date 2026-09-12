import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";

function createResponse() {
  return {
    headersSent: false,
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

for (const type of ["charset.unsupported", "encoding.unsupported"]) {
  test(`returns 415 for ${type}`, () => {
    const response = createResponse();
    const error = Object.assign(new Error("unsupported media type"), {
      status: 415,
      type
    });

    errorHandler(error, {}, response, () => {
      assert.fail("next should not be called");
    });

    assert.equal(response.statusCode, 415);
    assert.deepEqual(response.body, {
      success: false,
      message: "Unsupported media type"
    });
  });
}

test("preserves the generic 500 response for unexpected errors", () => {
  const response = createResponse();

  errorHandler(new Error("boom"), {}, response, () => {
    assert.fail("next should not be called");
  });

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    success: false,
    message: "Unexpected server error"
  });
});
