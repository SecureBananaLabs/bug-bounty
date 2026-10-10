import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/login is throttled by the auth-specific limiter", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    let lastPayload;
    let lastStatus;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123"
        })
      });
      lastStatus = response.status;
      lastPayload = await response.json();
    }

    assert.equal(lastStatus, 429);
    assert.equal(lastPayload.success, false);
    assert.equal(lastPayload.message, "Too many auth attempts");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/refresh is also throttled by the auth-specific limiter", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    let lastPayload;
    let lastStatus;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
        method: "POST"
      });
      lastStatus = response.status;
      lastPayload = await response.json();
    }

    assert.equal(lastStatus, 429);
    assert.equal(lastPayload.success, false);
    assert.equal(lastPayload.message, "Too many auth attempts");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
