import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("malformed JSON requests are counted by the API rate limiter", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/jobs`;

    let response;
    for (let i = 0; i < 201; i += 1) {
      response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad json"
      });
    }

    assert.equal(response.status, 429);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
