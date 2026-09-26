import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/proposals rejects invalid payloads with 400", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid proposal payload");

  await stopServer(server);
});

test("POST /api/proposals accepts valid payloads", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_123",
      rate: 150,
      message: "I can deliver this this week."
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.jobId, "job_123");
  assert.equal(payload.data.rate, 150);
  assert.equal(payload.data.message, "I can deliver this this week.");
  assert.match(payload.data.id, /^prp_/);

  await stopServer(server);
});
