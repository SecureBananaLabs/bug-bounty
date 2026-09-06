import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("unknown /api routes return the shared JSON 404 envelope", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/does-not-exist`);
  const payload = await response.json();

  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
  assert.deepEqual(payload, {
    success: false,
    message: "Not found"
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
