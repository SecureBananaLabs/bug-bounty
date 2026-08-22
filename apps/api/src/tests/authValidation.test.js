import test from "node:test";
import assert from "node:assert/strict";
import { register } from "../controllers/authController.js";

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
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

test("register returns 400 for invalid request bodies", async () => {
  const res = createResponse();

  await register(
    {
      body: {
        email: "not-an-email",
        password: "short"
      }
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Invalid request body"
  });
});
