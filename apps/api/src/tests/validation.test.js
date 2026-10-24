import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  // Bound the request so a handler that never responds fails the test instead of hanging it.
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(5000)
  });

  return { status: response.status, payload: await response.json() };
}

test("POST /api/jobs responds 400 for an invalid body", async () => {
  await withServer(async (baseUrl) => {
    const { status, payload } = await postJson(baseUrl, "/api/jobs", { title: "x" });

    assert.equal(status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(Array.isArray(payload.errors));
    assert.ok(payload.errors.some((issue) => issue.path === "title"));
  });
});

test("POST /api/auth/register responds 400 for an invalid email", async () => {
  await withServer(async (baseUrl) => {
    const { status, payload } = await postJson(baseUrl, "/api/auth/register", {
      email: "not-an-email",
      password: "correct-horse"
    });

    assert.equal(status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((issue) => issue.path === "email"));
  });
});

test("POST /api/jobs responds 400 for malformed JSON", async () => {
  await withServer(async (baseUrl) => {
    const { status, payload } = await postJson(baseUrl, "/api/jobs", "{not json");

    assert.equal(status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/jobs still creates a job for a valid body", async () => {
  await withServer(async (baseUrl) => {
    const { status, payload } = await postJson(baseUrl, "/api/jobs", {
      title: "Build a landing page",
      description: "Looking for a freelancer to build a marketing page.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_design"
    });

    assert.equal(status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.status, "open");
  });
});
