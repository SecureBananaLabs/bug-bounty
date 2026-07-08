import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/search requires q", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const missingResponse = await fetch(`http://127.0.0.1:${port}/api/search`);
  const missingPayload = await missingResponse.json();

  assert.equal(missingResponse.status, 400);
  assert.equal(missingPayload.success, false);
  assert.equal(missingPayload.message, "q is required");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/search rejects blank query", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const blankResponse = await fetch(`http://127.0.0.1:${port}/api/search?q=%20%20`);
  const blankPayload = await blankResponse.json();

  assert.equal(blankResponse.status, 400);
  assert.equal(blankPayload.success, false);
  assert.equal(blankPayload.message, "q is required");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/search accepts valid query", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=freelance`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "freelance");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
