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
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("async route rejections are forwarded to the error handler", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  await withServer(async (baseUrl) => {
    try {
      const response = await fetch(`${baseUrl}/api/jobs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const payload = await response.json();

      assert.equal(response.status, 500);
      assert.deepEqual(payload, {
        success: false,
        message: "Unexpected server error"
      });
    } finally {
      console.error = originalConsoleError;
    }
  });
});
