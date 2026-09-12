import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("JSON parsing and limit validation error handler tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    return new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("POST with malformed JSON body returns 400 Bad Request", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"malformed": ' // Invalid JSON syntax
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Malformed JSON request body/i);
  });

  await t.test("POST with oversized body returns 413 Payload Too Large", async () => {
    // Construct a payload larger than 100kb default limit
    const largeString = "a".repeat(110 * 1024);
    const body = JSON.stringify({ data: largeString });

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.equal(payload.success, false);
    assert.match(payload.message, /Request entity too large/i);
  });
});
