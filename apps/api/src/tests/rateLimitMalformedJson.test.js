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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("malformed JSON requests count toward the API rate limit", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await withServer(async (baseUrl) => {
      let finalStatus = 0;

      for (let attempt = 0; attempt < 201; attempt += 1) {
        const response = await fetch(`${baseUrl}/api/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{bad json"
        });
        finalStatus = response.status;
        await response.arrayBuffer();
      }

      assert.equal(finalStatus, 429);
    });
  } finally {
    console.error = originalConsoleError;
  }
});
