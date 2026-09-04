import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startTestServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function closeTestServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("API rate limit responses use JSON error payloads", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    let response;

    for (let i = 0; i < 201; i += 1) {
      response = await fetch(`${baseUrl}/api/jobs`);
    }

    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.deepEqual(payload, { success: false, message: "Too many requests" });
  } finally {
    await closeTestServer(server);
  }
});
