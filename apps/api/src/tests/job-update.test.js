import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer(t) {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  return `http://127.0.0.1:${server.address().port}`;
}

test("PATCH /api/jobs/:id applies partial updates and preserves the job id", async (t) => {
  const baseUrl = await startServer(t);
  const createdResponse = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Original job title",
      description: "Original job description",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "category-1"
    })
  });
  const created = await createdResponse.json();

  const response = await fetch(`${baseUrl}/api/jobs/${created.data.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: "client-controlled-id",
      title: "Updated job title"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.id, created.data.id);
  assert.equal(payload.data.title, "Updated job title");
  assert.equal(payload.data.description, "Original job description");
});

test("PATCH /api/jobs/:id returns 404 for an unknown job", async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/api/jobs/job-missing`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Updated job title" })
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Job not found"
  });
});
