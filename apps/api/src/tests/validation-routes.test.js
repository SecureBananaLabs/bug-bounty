import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("POST /api/jobs returns 400 for invalid job payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(baseUrl, "/api/jobs", {
      title: "",
      budgetMin: "bad"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid job payload"
    });
  });
});

test("POST /api/auth/register returns 400 for invalid registration payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(baseUrl, "/api/auth/register", {
      email: "not-an-email",
      password: "short"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid registration payload"
    });
  });
});

test("POST /api/auth/login returns 400 for invalid login payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email: "not-an-email",
      password: "short"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid login payload"
    });
  });
});
