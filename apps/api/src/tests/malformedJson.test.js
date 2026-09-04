import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("malformed JSON request bodies return 400 without unhandled error logging", async () => {
  const app = createApp();
  const server = app.listen(0);
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"email":'
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Malformed JSON request body"
    });
    assert.equal(errors.length, 0);
  } finally {
    console.error = originalError;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
