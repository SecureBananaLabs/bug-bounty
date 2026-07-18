import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /auth/register returns 400 for invalid request body", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/register", {
      email: "not-an-email",
      password: "short"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid request body"
    });
  });
});

test("POST /auth/login returns 400 for invalid request body", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/login", {
      email: "not-an-email",
      password: "short"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid request body"
    });
  });
});