import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/users strips secret fields from the persisted record", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const create = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Tester",
        password: "supersecret123",
      }),
    });
    const created = await create.json();
    assert.equal(create.status, 201);
    assert.equal(created.success, true);
    assert.equal(created.data.password, undefined, "password should be stripped");
    assert.equal(created.data.email, "test@example.com");
    assert.equal(created.data.name, "Tester");

    const list = await fetch(`${base}/api/users`);
    const listed = await list.json();
    assert.equal(list.status, 200);
    assert.equal(listed.success, true);
    assert.equal(listed.data.length, 1);
    assert.equal(listed.data[0].password, undefined, "password should not be returned by list");
  } finally {
    await new Promise((r) => server.close(() => r()));
  }
});
