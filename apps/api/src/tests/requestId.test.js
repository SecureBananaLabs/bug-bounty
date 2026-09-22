import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("requestIdMiddleware generates unique X-Request-Id header", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const reqId = response.headers.get("x-request-id");

  assert.equal(response.status, 200);
  assert.ok(reqId && reqId.length > 10, "X-Request-Id header should be generated");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("requestIdMiddleware propagates existing X-Request-Id header", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const customId = "trace-client-abc-123";
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { "x-request-id": customId }
  });

  const reqId = response.headers.get("x-request-id");
  assert.equal(reqId, customId);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
