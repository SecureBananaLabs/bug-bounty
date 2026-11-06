import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer() {
  return new Promise((resolve, reject) => {
    const app = createApp();
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/jobs returns 401 without authentication", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Job", budget: "$100" })
    });
    assert.equal(response.status, 401);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs returns 401 with invalid token", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token"
      },
      body: JSON.stringify({ title: "Test Job", budget: "$100" })
    });
    assert.equal(response.status, 401);
  } finally {
    await closeServer(server);
  }
});
