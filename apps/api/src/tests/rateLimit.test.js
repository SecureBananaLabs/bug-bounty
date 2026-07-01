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

test("malformed JSON requests consume the API rate limit", async () => {
  await withServer(async (baseUrl) => {
    let response;
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      for (let i = 0; i < 201; i += 1) {
        response = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{"
        });
      }
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(response.status, 429);
  });
});
