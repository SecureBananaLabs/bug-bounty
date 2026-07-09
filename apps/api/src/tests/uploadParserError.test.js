import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("unexpected upload fields return 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const form = new FormData();
    form.append("avatar", new Blob(["avatar-bytes"], { type: "text/plain" }), "avatar.txt");

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
      method: "POST",
      body: form
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid upload request"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
