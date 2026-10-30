import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { _resetJobs, listJobs } from "../services/jobService.js";

test("Job Detail By ID & Array Encapsulation", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    _resetJobs();
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("GET /api/jobs/:id returns 404 when job does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/jobs/non_existent_id`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Job not found");
  });

  await t.test("POST /api/jobs creates a job and GET /api/jobs/:id resolves it", async () => {
    const createRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Full Stack Engineer Needed",
        description: "Looking for an experienced engineer with Node and React.",
        budgetMin: 1000,
        budgetMax: 2500,
        categoryId: "cat_eng",
        skills: ["Node.js", "React"]
      })
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    const jobId = createBody.data.id;
    assert.ok(jobId);

    // Now resolve by id
    const getRes = await fetch(`${baseUrl}/api/jobs/${jobId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.equal(getBody.data.id, jobId);
    assert.equal(getBody.data.title, "Full Stack Engineer Needed");
    assert.equal(getBody.data.budgetMin, 1000);
    assert.equal(getBody.data.budgetMax, 2500);
  });

  await t.test("listJobs returns a defensive snapshot array", async () => {
    const createRes = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Frontend Specialist",
        description: "Need Vue.js expert for urgent 2-week delivery.",
        budgetMin: 800,
        budgetMax: 1200,
        categoryId: "cat_fe",
        skills: ["Vue.js"]
      })
    });
    assert.equal(createRes.status, 201);

    const snapshot = await listJobs();
    assert.equal(snapshot.length, 1);
    snapshot.pop(); // Mutate the returned array

    const freshSnapshot = await listJobs();
    assert.equal(freshSnapshot.length, 1, "Backing store must remain uncorrupted");
  });
});
