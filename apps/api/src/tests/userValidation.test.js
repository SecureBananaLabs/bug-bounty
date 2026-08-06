import test from "node:test";
import assert from "node:assert/strict";
import { postUser } from "../controllers/userController.js";
import { createUserSchema } from "../validators/user.js";

const validUser = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "client"
};

function createResponse() {
  return {
    statusCode: 0,
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

test("createUserSchema rejects empty or malformed profiles", () => {
  assert.equal(createUserSchema.safeParse({ ...validUser, name: "" }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validUser, email: "not-an-email" }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validUser, role: "owner" }).success, false);
});

test("createUserSchema defaults missing role to client", () => {
  const result = createUserSchema.safeParse({
    name: "Grace Hopper",
    email: "grace@example.com"
  });

  assert.equal(result.success, true);
  assert.equal(result.data.role, "client");
});

test("postUser returns 400 before persisting invalid payloads", async () => {
  const response = createResponse();

  await postUser({ body: { name: "", email: "bad", role: "owner" } }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Invalid user payload"
  });
});

test("postUser persists validated user payloads", async () => {
  const response = createResponse();

  await postUser({ body: validUser }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.match(response.body.data.id, /^usr_/);
  assert.deepEqual(
    {
      name: response.body.data.name,
      email: response.body.data.email,
      role: response.body.data.role
    },
    validUser
  );
});
