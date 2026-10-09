import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("oversized JSON bodies are rejected with a 413 JSON envelope", async () => {
  const { server, port } = await listen(createApp());
  try {
    const huge = "x".repeat(200 * 1024);
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: huge })
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.equal(payload.success, false);
    assert.equal(typeof payload.message, "string");
  } finally {
    await close(server);
  }
});

test("normal sized payloads are still accepted", async () => {
  const { server, port } = await listen(createApp());
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Ship the fix",
        description: "Cap the JSON body size in the API",
        budgetMin: 400,
        budgetMax: 900,
        categoryId: "cat_backend",
        skills: ["node"]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, "Ship the fix");
  } finally {
    await close(server);
  }
});
