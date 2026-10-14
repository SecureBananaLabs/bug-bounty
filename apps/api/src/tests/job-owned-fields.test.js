import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const payload = {
  id: "job_client_controlled",
  status: "closed",
  title: "Backend API cleanup",
  description: "Deliver a focused fix for the reporting endpoint.",
  budgetMin: 100,
  budgetMax: 250,
  categoryId: "cat_backend",
  skills: ["node.js"]
};

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

test("POST /api/jobs preserves the server-generated id and open status", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    assert.equal(response.status, 201);
    assert.equal(result.success, true);
    assert.notEqual(result.data.id, payload.id);
    assert.equal(result.data.status, "open");
    assert.equal(result.data.title, payload.title);
    assert.equal(result.data.description, payload.description);
  });
});
