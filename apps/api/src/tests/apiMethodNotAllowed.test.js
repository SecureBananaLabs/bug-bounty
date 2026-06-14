import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("unsupported methods on known API collections return JSON 405", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, { method: "PUT" });
    const payload = await response.json();

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("content-type").includes("application/json"), true);
    assert.equal(response.headers.get("allow"), "GET, POST");
    assert.deepEqual(payload, {
      success: false,
      message: "Method PUT not allowed"
    });
  });
});

test("supported API collection methods keep existing behavior", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { success: true, data: [] });
  });
});
