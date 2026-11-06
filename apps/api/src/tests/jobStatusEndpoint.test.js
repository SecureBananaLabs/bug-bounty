import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function createJob(base) {
  const response = await fetch(`${base}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Build a landing page",
      description: "Needs a responsive marketing landing page",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_1",
      skills: ["react"]
    })
  });

  const payload = await response.json();

  return payload.data.id;
}

test("PATCH /api/jobs/:id/status moves a job through the lifecycle", async () => {
  await withServer(async (base) => {
    const id = await createJob(base);

    const response = await fetch(`${base}/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.id, id);
    assert.equal(payload.data.status, "IN_PROGRESS");
  });
});

test("PATCH /api/jobs/:id/status rejects a status outside the JobStatus enum", async () => {
  await withServer(async (base) => {
    const id = await createJob(base);

    const response = await fetch(`${base}/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "FINISHED" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);

    const list = await fetch(`${base}/api/jobs`);
    const listed = await list.json();
    const job = listed.data.find((item) => item.id === id);

    assert.notEqual(job.status, "FINISHED");
  });
});

test("PATCH /api/jobs/:id/status requires a status in the body", async () => {
  await withServer(async (base) => {
    const id = await createJob(base);

    const response = await fetch(`${base}/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    assert.equal(response.status, 400);
  });
});

test("PATCH /api/jobs/:id/status reports not found for an unknown job", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/jobs/job_missing/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" })
    });
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Job not found");
  });
});

test("PATCH /api/jobs/:id/status only changes the lifecycle status", async () => {
  await withServer(async (base) => {
    const id = await createJob(base);

    const response = await fetch(`${base}/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", title: "hijacked" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.status, "CANCELLED");
    assert.equal(payload.data.title, "Build a landing page");
  });
});
