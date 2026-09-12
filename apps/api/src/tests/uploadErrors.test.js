import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/uploads maps Multer parser errors to 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const form = new FormData();
    form.append("avatar", new Blob(["test"], { type: "text/plain" }), "test.txt");

    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /unexpected field/i);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
