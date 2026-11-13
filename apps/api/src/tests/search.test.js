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

test("GET /api/search requires query and normalizes it", async () => {
  await withServer(async (baseUrl) => {
    const blank = await fetch(`${baseUrl}/api/search?q=  `, { method: "GET" });
    assert.equal(blank.status, 400);

    const longQuery = "a".repeat(201);
    const longResponse = await fetch(`${baseUrl}/api/search?q=${longQuery}`, { method: "GET" });
    assert.equal(longResponse.status, 400);

    const response = await fetch(`${baseUrl}/api/search?q=%20alice%20`, { method: "GET" });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "alice");
  });
});
