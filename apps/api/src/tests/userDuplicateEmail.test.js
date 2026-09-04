import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createUser, DuplicateUserEmailError, listUsers } from "../services/userService.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("createUser rejects duplicate email addresses without storing another user", async () => {
  const listLengthBefore = (await listUsers()).length;

  await createUser({ email: "duplicate-service@example.com", fullName: "Alex One" });
  await assert.rejects(
    () => createUser({ email: "duplicate-service@example.com", fullName: "Alex Two" }),
    DuplicateUserEmailError
  );
  assert.equal((await listUsers()).length, listLengthBefore + 1);
});

test("POST /api/users returns 409 for duplicate email addresses", async () => {
  const listLengthBefore = (await listUsers()).length;
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const firstResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "duplicate-route@example.com",
        fullName: "Alex One"
      })
    });
    const secondResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "duplicate-route@example.com",
        fullName: "Alex Two"
      })
    });
    const secondPayload = await secondResponse.json();

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 409);
    assert.deepEqual(secondPayload, {
      success: false,
      message: "User email already exists"
    });
    assert.equal((await listUsers()).length, listLengthBefore + 1);
  } finally {
    await close(server);
  }
});
