import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("unmatched API routes return JSON 404", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/unknown-route`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, {
      success: false,
      message: "Route not found"
    });
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
