import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/users does not persist submitted passwords", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "redacted@example.com",
        password: "do-not-return-this",
        role: "client"
      })
    });
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.success, true);
    assert.equal(created.data.email, "redacted@example.com");
    assert.equal(created.data.role, "client");
    assert.equal("password" in created.data, false);

    const listResponse = await fetch(`http://127.0.0.1:${port}/api/users`);
    const listed = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listed.success, true);
    assert.equal(listed.data.at(-1).email, "redacted@example.com");
    assert.equal("password" in listed.data.at(-1), false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
