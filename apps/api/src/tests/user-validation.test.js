import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postUser(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/users rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {});

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/users rejects admin self-creation", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "admin@example.com",
      role: "admin"
    });

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/users accepts valid client users", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      email: "client@example.com",
      role: "client"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "client@example.com");
    assert.equal(payload.data.role, "client");
  });
});
