import test from "node:test";
import assert from "node:assert/strict";
import { postUser } from "../controllers/userController.js";

function createResponseRecorder() {
  return {
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

test("postUser rejects invalid payloads with 400", async () => {
  const req = {
    body: {
      email: "not-an-email",
      password: "short"
    }
  };
  const res = createResponseRecorder();

  await postUser(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    message: "Invalid user payload"
  });
});

test("postUser accepts valid payloads and returns created user", async () => {
  const req = {
    body: {
      email: "user@example.com",
      password: "password123",
      role: "client",
      fullName: "Example User"
    }
  };
  const res = createResponseRecorder();

  await postUser(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.email, "user@example.com");
  assert.equal(res.body.data.role, "client");
  assert.equal(res.body.data.fullName, "Example User");
  assert.match(res.body.data.id, /^usr_/);
});
