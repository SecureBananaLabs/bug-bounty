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
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function createValidJobPayload() {
  return {
    title: "Build landing page",
    description: "Need a production-ready responsive landing page build.",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "web",
    skills: ["react"]
  };
}

test("POST /api/jobs rejects oversized title and description with stable 400", async () => {
  await withServer(async (baseUrl) => {
    const oversizedTitleResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...createValidJobPayload(),
        title: "t".repeat(201)
      })
    });
    const oversizedTitlePayload = await oversizedTitleResponse.json();

    assert.equal(oversizedTitleResponse.status, 400);
    assert.deepEqual(oversizedTitlePayload, {
      success: false,
      message: "Invalid job payload"
    });

    const oversizedDescriptionResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...createValidJobPayload(),
        description: "d".repeat(5001)
      })
    });
    const oversizedDescriptionPayload = await oversizedDescriptionResponse.json();

    assert.equal(oversizedDescriptionResponse.status, 400);
    assert.deepEqual(oversizedDescriptionPayload, {
      success: false,
      message: "Invalid job payload"
    });
  });
});

test("POST /api/jobs accepts title/description at max lengths", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...createValidJobPayload(),
        title: "t".repeat(200),
        description: "d".repeat(5000)
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title.length, 200);
    assert.equal(payload.data.description.length, 5000);
  });
});
