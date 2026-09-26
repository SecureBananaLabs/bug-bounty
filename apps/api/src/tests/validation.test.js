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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { response, body: await response.json() };
}

test("POST /api/jobs returns 400 for invalid job payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postJson(baseUrl, "/api/jobs", {
      title: "bad",
      description: "short",
      budgetMin: -1,
      budgetMax: 50,
      categoryId: "",
      skills: ["javascript"]
    });

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      message: "Invalid job payload"
    });
  });
});

test("POST /api/auth/register returns 400 for invalid registration payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postJson(baseUrl, "/api/auth/register", {
      email: "not-an-email",
      password: "short"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      message: "Invalid registration payload"
    });
  });
});

test("POST /api/auth/login returns 400 for invalid login payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await postJson(baseUrl, "/api/auth/login", {
      email: "client@example.com",
      password: "short"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      message: "Invalid login payload"
    });
  });
});
