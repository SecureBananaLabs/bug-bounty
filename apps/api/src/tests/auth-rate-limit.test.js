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

test("auth routes return 429 after 20 requests in a 15-minute window", async () => {
  await withServer(async (baseUrl) => {
    let response;
    for (let index = 0; index < 20; index += 1) {
      response = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
      assert.equal(response.status, 200);
    }

    response = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.equal(payload.message, "Too many authentication requests");
  });
});
