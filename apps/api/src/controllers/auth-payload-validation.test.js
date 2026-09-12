import { test } from "node:test";
import assert from "node:assert/strict";
import { register, login } from "./authController.js";

test("register returns 400 Bad Request for invalid payload", async () => {
  let statusCode = 0;
  let responseData = null;

  const req = { body: { email: "not-an-email" } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await register(req, res);

  assert.equal(statusCode, 400, "Invalid register payload must return HTTP 400");
  assert.equal(responseData?.error, "Invalid payload", "Error message must indicate invalid payload");
});

test("login returns 400 Bad Request for invalid payload", async () => {
  let statusCode = 0;
  let responseData = null;

  const req = { body: {} };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await login(req, res);

  assert.equal(statusCode, 400, "Invalid login payload must return HTTP 400");
  assert.equal(responseData?.error, "Invalid payload", "Error message must indicate invalid payload");
});
