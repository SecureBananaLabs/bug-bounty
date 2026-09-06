import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/jobs rejects oversized JSON request bodies", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x".repeat(110 * 1024) })
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Request body is too large"
    });
  } finally {
    await close(server);
  }
});

test("POST /api/jobs continues to parse normal-sized JSON request bodies", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Small test job",
        description: "A normal-sized JSON body should still parse.",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "testing",
        skills: ["api"]
      })
    });

    assert.equal(response.status, 201);
  } finally {
    await close(server);
  }
});
