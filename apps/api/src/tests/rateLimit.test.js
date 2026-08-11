import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Rate limiter should count malformed JSON before body parsing", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // We make 205 requests with malformed JSON.
  // The rate limiter is configured with a limit of 200 requests per 15 minutes.
  // The 201st request should be rejected with 429 Too Many Requests.
  let lastStatus = 0;
  for (let i = 0; i < 205; i++) {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{bad json",
    });
    lastStatus = response.status;
    if (lastStatus === 429) {
      break;
    }
  }

  assert.equal(lastStatus, 429);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
