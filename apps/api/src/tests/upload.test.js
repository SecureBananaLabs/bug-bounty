import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("POST /api/uploads rejects a multipart request with no file", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST", body: new FormData() });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { success: false, message: "File is required" });
  });
});
