import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("malformed JSON requests are counted by the API rate limiter", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  await withServer(async (baseUrl) => {
    try {
      let lastStatus;

      for (let i = 0; i < 201; i += 1) {
        const response = await fetch(`${baseUrl}/api/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{"
        });
        lastStatus = response.status;
      }

      assert.equal(lastStatus, 429);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
