import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("unmatched routes return the JSON 404 envelope", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/does-not-exist`);
  const contentType = response.headers.get("content-type") ?? "";

  assert.equal(response.status, 404);
  assert.ok(contentType.includes("application/json"));

  const payload = await response.json();

  assert.deepEqual(payload, { success: false, message: "Not found" });

  await close(server);
});

test("defined routes keep their existing behaviour", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await close(server);
});
