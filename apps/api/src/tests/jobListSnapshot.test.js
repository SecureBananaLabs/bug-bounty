import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJob, listJobs } from "../services/jobService.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("listJobs returns an array that callers can mutate safely", async () => {
  await createJob({
    title: "Fix the billing page",
    description: "Wire the existing endpoints into the billing screen",
    budgetMin: 200,
    budgetMax: 600,
    categoryId: "cat_web",
    skills: ["react"]
  });

  const snapshot = await listJobs();
  const length = snapshot.length;
  snapshot.pop();

  assert.equal(snapshot.length, length - 1);
  assert.equal((await listJobs()).length, length);
});

test("job route lists stored jobs after a snapshot is taken", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const before = (await (await fetch(`${base}/api/jobs`)).json()).data.length;

    const created = await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Write release notes",
        description: "Summarise the changes shipped this quarter",
        budgetMin: 50,
        budgetMax: 120,
        categoryId: "cat_docs",
        skills: ["writing"]
      })
    });
    assert.equal(created.status, 201);

    const after = await (await fetch(`${base}/api/jobs`)).json();
    assert.equal(after.data.length, before + 1);
    assert.equal(after.data[after.data.length - 1].status, "open");
  } finally {
    await close(server);
  }
});
