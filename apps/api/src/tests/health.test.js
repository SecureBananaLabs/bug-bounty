import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const payload = await response.json();
    const cacheDirectives = response.headers
      .get("cache-control")
      ?.split(",")
      .map((directive) => directive.trim().toLowerCase());

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^application\/json\b/);
    assert.ok(cacheDirectives?.includes("no-store"));
    assert.deepEqual(payload, { ok: true, service: "api" });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
