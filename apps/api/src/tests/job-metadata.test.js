import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const validJobPayload = {
  title: "Build search page",
  description: "Implement a searchable job listing page.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web",
  skills: ["react", "node"]
};

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

async function postJob(baseUrl, payload) {
  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

test("POST /api/jobs accepts normal job metadata", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJob(baseUrl, validJobPayload);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.title, validJobPayload.title);
    assert.equal(payload.data.description, validJobPayload.description);
    assert.deepEqual(payload.data.skills, validJobPayload.skills);
  });
});

test("POST /api/jobs rejects oversized job metadata", async () => {
  await withServer(async (baseUrl) => {
    const oversizedCases = [
      { name: "title", payload: { ...validJobPayload, title: "t".repeat(121) } },
      { name: "description", payload: { ...validJobPayload, description: "d".repeat(2001) } },
      { name: "categoryId", payload: { ...validJobPayload, categoryId: "c".repeat(81) } },
      { name: "skill name", payload: { ...validJobPayload, skills: ["s".repeat(61)] } },
      { name: "skill list", payload: { ...validJobPayload, skills: Array.from({ length: 21 }, (_, index) => `skill-${index}`) } }
    ];

    for (const { name, payload } of oversizedCases) {
      const response = await postJob(baseUrl, payload);
      const body = await response.json();

      assert.equal(response.status, 400, name);
      assert.equal(body.success, false, name);
      assert.equal(body.message, "Invalid job payload", name);
    }
  });
});
