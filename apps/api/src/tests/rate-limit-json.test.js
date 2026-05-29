import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startApp(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

test("rate limiter returns JSON error for 429 responses", async () => {
  const app = createApp();
  const server = await startApp(app);
  const { port } = server.address();

  // Make 201 requests to exceed the limit
  const results = [];
  for (let i = 0; i < 201; i++) {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    results.push({ status: res.status, contentType: res.headers.get("content-type") });
  }

  const lastResult = results[results.length - 1];
  assert.equal(lastResult.status, 429);
  assert.match(lastResult.contentType, /json/);

  // Verify the body is valid JSON with the expected shape
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  if (res.status === 429) {
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.message);
  }

  await new Promise((r) => server.close(r));
});
