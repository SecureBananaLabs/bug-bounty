import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST with invalid JSON returns 400 with the shared failure envelope", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ this is not valid JSON",
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(typeof payload.message, "string");
    assert.ok(payload.message.length > 0);
  } finally {
    await new Promise((r) => server.close(() => r()));
  }
});

test("POST with valid JSON to /api/users still succeeds (201)", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ok@example.com", name: "Ok User" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "ok@example.com");
  } finally {
    await new Promise((r) => server.close(() => r()));
  }
});
