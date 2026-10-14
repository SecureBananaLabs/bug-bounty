import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("user responses do not expose submitted passwords", async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        name: "Example User",
        password: "s3cret-pass"
      })
    });
    const createdUser = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createdUser.data.email, "user@example.com");
    assert.equal("password" in createdUser.data, false);

    const listResponse = await fetch(`${baseUrl}/api/users`);
    const listedUsers = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.ok(listedUsers.data.some((user) => user.email === "user@example.com"));
    assert.equal(listedUsers.data.some((user) => "password" in user), false);
  });
});
