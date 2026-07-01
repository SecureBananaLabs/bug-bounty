import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createUser, DuplicateUserEmailError, listUsers } from "../services/userService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("createUser rejects duplicate email addresses", async () => {
  const beforeCount = (await listUsers()).length;
  await createUser({ email: "alex@example.com", fullName: "Alex One" });

  await assert.rejects(
    () => createUser({ email: "alex@example.com", fullName: "Alex Two" }),
    DuplicateUserEmailError
  );

  assert.equal((await listUsers()).length, beforeCount + 1);
});

test("POST /api/users maps duplicate emails to HTTP 409", async () => {
  await withServer(async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "sam@example.com", fullName: "Sam One" })
    });
    const second = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "sam@example.com", fullName: "Sam Two" })
    });
    const payload = await second.json();

    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.deepEqual(payload, {
      success: false,
      message: "User email already exists: sam@example.com"
    });
  });
});
