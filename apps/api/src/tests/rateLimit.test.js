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
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("rate limiter counts malformed JSON before body parsing", async () => {
  await withServer(async (baseUrl) => {
    const originalError = console.error;
    console.error = () => {};

    try {
      let response;

      for (let index = 0; index < 201; index += 1) {
        response = await fetch(`${baseUrl}/api/jobs`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{\"title\":"
        });
      }

      assert.equal(response.status, 429);
    } finally {
      console.error = originalError;
    }
  });
});
