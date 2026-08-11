import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("PATCH /api/jobs/:id updates an existing job", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const createRes = await fetch(`${baseURL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Original Job Title",
      description: "This is the original job description",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat-1",
      skills: ["javascript"]
    })
  });
  const created = await createRes.json();
  const jobId = created.data.id;

  const updateRes = await fetch(`${baseURL}/api/jobs/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Updated Job Title",
      budgetMax: 600
    })
  });

  assert.equal(updateRes.status, 200, "Should return 200 on successful update");
  const updated = await updateRes.json();
  assert.equal(updated.data.title, "Updated Job Title", "Title should be updated");
  assert.equal(updated.data.budgetMax, 600, "BudgetMax should be updated");
  assert.equal(updated.data.budgetMin, 100, "BudgetMin should remain unchanged");
  assert.equal(updated.data.id, jobId, "Job id should be preserved");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("PATCH /api/jobs/:id returns 404 for non-existent job", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/jobs/non_existent_id`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated Title" })
  });

  assert.equal(res.status, 404, "Should return 404 for non-existent job");
  const body = await res.json();
  assert.equal(body.success, false, "Should return failure response");
  assert.ok(body.message.includes("not found"), "Error message should indicate not found");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("PATCH /api/jobs/:id rejects invalid budget range", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const createRes = await fetch(`${baseURL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Job for Validation Test",
      description: "Testing budget validation on update",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat-1",
      skills: []
    })
  });
  const created = await createRes.json();
  const jobId = created.data.id;

  const updateRes = await fetch(`${baseURL}/api/jobs/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      budgetMin: 1000,
      budgetMax: 100
    })
  });

  assert.equal(updateRes.status, 400, "Should return 400 for inverted budget range");
  const body = await updateRes.json();
  assert.equal(body.status, "error", "Should return error status");
  assert.ok(body.errors.some(e => e.field === "budgetMax"), "Should have budgetMax error");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
