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

test("POST /api/notifications ignores caller-supplied id", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "ntf_hacker", message: "test" })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.notEqual(body.data.id, "ntf_hacker");
    assert.ok(body.data.id.startsWith("ntf_"));
  } finally {
    await closeServer(server);
  }
});

test("POST /api/notifications ignores caller-supplied read field", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true, message: "test" })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.data.read, false);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/notifications creates notification with server-generated id and read: false", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.ok(body.data.id.startsWith("ntf_"));
    assert.equal(body.data.read, false);
    assert.equal(body.data.message, "Hello");
  } finally {
    await closeServer(server);
  }
});
