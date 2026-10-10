import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function json(res) {
  assert.equal(res.status, 200);
  return res.json();
}

test("search returns jobs matching the query terms", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    const created = await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Senior React engineer",
        description: "Build a dashboard for a logistics company",
        budgetMin: 400,
        budgetMax: 900,
        categoryId: "cat_1",
        skills: ["react", "typescript"]
      })
    });
    assert.equal(created.status, 201);

    const body = await json(await fetch(`${base}/api/search?q=react`));
    assert.equal(body.success, true);
    assert.equal(body.data.query, "react");
    assert.equal(body.data.jobs.length, 1);
    assert.equal(body.data.jobs[0].title, "Senior React engineer");
  } finally {
    await close(server);
  }
});

test("search narrows results with every term and ignores case", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Logo design",
        description: "A minimal logo for a bakery",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "cat_2",
        skills: ["illustrator"]
      })
    });

    const body = await json(await fetch(`${base}/api/search?q=BAKERY%20logo`));
    assert.equal(body.data.jobs.length, 1);
    assert.equal(body.data.jobs[0].title, "Logo design");

    const none = await json(await fetch(`${base}/api/search?q=bakery%20react`));
    assert.equal(none.data.jobs.length, 0);
  } finally {
    await close(server);
  }
});

test("search with no query term returns empty groups", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const body = await json(await fetch(`${base}/api/search`));
    assert.deepEqual(body.data, { query: "", users: [], jobs: [], freelancers: [] });
  } finally {
    await close(server);
  }
});
