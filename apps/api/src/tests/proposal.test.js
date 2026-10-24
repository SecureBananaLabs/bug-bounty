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

test("POST /api/proposals rejects missing estDuration", async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        freelancerId: "usr_456",
        coverLetter: "I can complete this safely.",
        bidAmount: 250
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /estDuration/i);
  } finally {
    await stopServer(server);
  }
});

test("POST /api/proposals rejects blank estDuration", async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        freelancerId: "usr_456",
        coverLetter: "I can complete this safely.",
        bidAmount: 250,
        estDuration: ""
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /estDuration/i);
  } finally {
    await stopServer(server);
  }
});

test("POST /api/proposals accepts valid proposal payloads", async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        freelancerId: "usr_456",
        coverLetter: "I can complete this safely.",
        bidAmount: 250,
        estDuration: "2 weeks"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.estDuration, "2 weeks");
  } finally {
    await stopServer(server);
  }
});
