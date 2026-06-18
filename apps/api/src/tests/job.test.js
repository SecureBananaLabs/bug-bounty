import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function fetchLocal(app, path, options = {}) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const url = "http://127.0.0.1:" + port + path;
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const body = await response.json();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return { response, body };
}

test("PATCH /api/jobs/:id updates job fields partially", async () => {
  const app = createApp();
  const create = await fetchLocal(app, "/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      title: "Original Title",
      description: "Original description for the job post",
      budgetMin: 100, budgetMax: 500, categoryId: "cat_1", skills: ["node", "react"]
    }),
  });
  assert.equal(create.response.status, 201);
  const jobId = create.body.data.id;
  const patch = await fetchLocal(app, "/api/jobs/" + jobId, {
    method: "PATCH", body: JSON.stringify({ title: "Updated Title" })
  });
  assert.equal(patch.response.status, 200);
  assert.equal(patch.body.success, true);
  assert.equal(patch.body.data.title, "Updated Title");
  assert.equal(patch.body.data.id, jobId);
  assert.equal(patch.body.data.description, "Original description for the job post");
});

test("PATCH /api/jobs/:id returns 404 for unknown id", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/jobs/nonexistent", {
    method: "PATCH", body: JSON.stringify({ title: "Nope" })
  });
  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

test("PATCH /api/jobs/:id rejects invalid payload", async () => {
  const app = createApp();
  const { response, body } = await fetchLocal(app, "/api/jobs/someid", {
    method: "PATCH", body: JSON.stringify({ budgetMin: "not-a-number" })
  });
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});
