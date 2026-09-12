import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("unsupported methods on known API collection routes return JSON 405", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "PUT"
    });
    const payload = await response.json();

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, POST");
    assert.deepEqual(payload, {
      success: false,
      message: "Method not allowed"
    });
  });
});

test("supported methods on known API collection routes keep their behavior", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`);

    assert.notEqual(response.status, 405);
  });
});
