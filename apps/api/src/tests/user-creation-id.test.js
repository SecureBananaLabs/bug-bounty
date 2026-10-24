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

test("POST /api/users ignores caller-supplied id", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "usr_hacker", email: "test@example.com", fullName: "John Doe" })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.notEqual(body.data.id, "usr_hacker");
    assert.ok(body.data.id.startsWith("usr_"));
  } finally {
    await closeServer(server);
  }
});

test("POST /api/users creates user with server-generated id", async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", fullName: "John Doe" })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.ok(body.data.id.startsWith("usr_"));
    assert.equal(body.data.email, "test@example.com");
    assert.equal(body.data.fullName, "John Doe");
  } finally {
    await closeServer(server);
  }
});
