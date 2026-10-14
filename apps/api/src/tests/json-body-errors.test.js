import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createApp } from "../app.js";
import { errorHandler } from "../middleware/errorHandler.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("malformed JSON request bodies return 400", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"email":"broken@example.com",'
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Malformed JSON request body"
    });
  });
});

test("oversized JSON request bodies return 413", async () => {
  await withServer(async (port) => {
    const largeBody = JSON.stringify({
      email: "large@example.com",
      password: "x".repeat(110_000)
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: largeBody
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "JSON request body is too large"
    });
  });
});

test("unexpected server errors still return 500", async () => {
  const app = express();
  app.get("/boom", () => {
    throw new Error("boom");
  });
  app.use(errorHandler);

  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/boom`);
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(payload, {
      success: false,
      message: "Unexpected server error"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
