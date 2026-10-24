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

async function post(base, body) {
  const response = await fetch(`${base}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

test("review creation accepts a rating inside the range", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const created = await post(base, { jobId: "job_1", rating: 4, comment: "solid work" });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.rating, 4);
    assert.equal(created.body.data.comment, "solid work");
  } finally {
    await close(server);
  }
});

test("review creation rejects a rating above the range", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const created = await post(base, { jobId: "job_1", rating: 9 });

    assert.equal(created.status, 400);
    assert.equal(created.body.success, false);
  } finally {
    await close(server);
  }
});

test("review creation rejects a missing rating", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const created = await post(base, { jobId: "job_1" });

    assert.equal(created.status, 400);
  } finally {
    await close(server);
  }
});
