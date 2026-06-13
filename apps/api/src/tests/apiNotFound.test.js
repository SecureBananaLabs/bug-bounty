import assert from "node:assert/strict";
import test from "node:test";
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
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
}

test("unmatched API routes return the JSON 404 contract for any method", async () => {
  await withServer(async (baseUrl) => {
    for (const [method, path] of [
      ["GET", "/api/does-not-exist"],
      ["POST", "/api/nested/does-not-exist"],
      ["DELETE", "/api/jobs/does-not-exist"]
    ]) {
      const response = await fetch(`${baseUrl}${path}`, { method });
      const payload = await response.json();

      assert.equal(response.status, 404, `${method} ${path}`);
      assert.match(response.headers.get("content-type"), /^application\/json\b/);
      assert.deepEqual(payload, { success: false, message: "Not found" });
    }
  });
});

test("registered API routes still reach their handlers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  });
});

test("non-API routes retain the default Express 404 response", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/does-not-exist`);

    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type"), /^text\/html\b/);
  });
});
