import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("JSON body payload size limit", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  await t.test("POST /health check handles small JSON payload normally", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ping: "pong" })
    });
    assert.notEqual(response.status, 413);
  });

  await t.test("POST /health check rejects oversized JSON payload", async () => {
    const largeString = "a".repeat(101 * 1024);
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: largeString })
    });
    assert.equal(response.status, 413);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
