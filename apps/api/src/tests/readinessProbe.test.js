import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { checkReadiness } from "../utils/readiness.js";

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

test("GET /ready reports ready when the database answers", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/ready`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api", ready: true });

  await close(server);
});

test("readiness is false when the database connection fails", async () => {
  const failing = await checkReadiness(async () => {
    throw new Error("database is down");
  });

  assert.equal(failing, false);

  const empty = await checkReadiness(async () => ({ connected: false }));

  assert.equal(empty, false);
});

test("GET /health still returns the liveness envelope", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await close(server);
});
