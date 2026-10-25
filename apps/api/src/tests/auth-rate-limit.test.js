import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("auth routes enforce a stricter rate limit", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  let finalResponse;

  for (let attempt = 0; attempt < 21; attempt += 1) {
    finalResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "worker@example.com",
        password: "long-enough-password"
      })
    });
  }

  const payload = await finalResponse.json();

  assert.equal(finalResponse.status, 429);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
