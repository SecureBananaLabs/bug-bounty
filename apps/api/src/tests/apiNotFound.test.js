import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function assertJsonNotFound(url, init) {
  const response = await fetch(url, init);
  const payload = await response.json();

  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.deepEqual(payload, { success: false, message: "Not found" });
}

test("unmatched API routes return the shared JSON 404 envelope", async () => {
  await withServer(async (baseUrl) => {
    await assertJsonNotFound(`${baseUrl}/api/not-real`);
    await assertJsonNotFound(`${baseUrl}/api/not-real/deep/path`);
    await assertJsonNotFound(`${baseUrl}/api/users/unknown`, { method: "POST" });
    await assertJsonNotFound(`${baseUrl}/api/search`, { method: "DELETE" });
  });
});

test("registered API routes still reach their real handlers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, []);
  });
});
