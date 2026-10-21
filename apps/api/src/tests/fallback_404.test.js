import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Unmatched API route JSON 404 contract suite", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unmatched GET route under /api
    const getRes = await fetch(`${baseUrl}/api/nonexistent`);
    assert.equal(getRes.status, 404);
    assert.match(getRes.headers.get("content-type"), /application\/json/);
    const getBody = await getRes.json();
    assert.deepEqual(getBody, { success: false, message: "Not found" });

    // 2. Unmatched POST route with nested path
    const postRes = await fetch(`${baseUrl}/api/v1/nested/custom/resource`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true })
    });
    assert.equal(postRes.status, 404);
    assert.match(postRes.headers.get("content-type"), /application\/json/);
    const postBody = await postRes.json();
    assert.deepEqual(postBody, { success: false, message: "Not found" });

    // 3. Unmatched PUT and DELETE requests
    const putRes = await fetch(`${baseUrl}/api/jobs/draft/unknown-action`, { method: "PUT" });
    assert.equal(putRes.status, 404);
    const putBody = await putRes.json();
    assert.deepEqual(putBody, { success: false, message: "Not found" });

    const deleteRes = await fetch(`${baseUrl}/api/random-delete`, { method: "DELETE" });
    assert.equal(deleteRes.status, 404);
    const deleteBody = await deleteRes.json();
    assert.deepEqual(deleteBody, { success: false, message: "Not found" });

    // 4. Existing registered endpoints continue to work as expected
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    const healthBody = await healthRes.json();
    assert.deepEqual(healthBody, { ok: true, service: "api" });

    const jobsRes = await fetch(`${baseUrl}/api/jobs`);
    assert.equal(jobsRes.status, 200);
    const jobsBody = await jobsRes.json();
    assert.equal(jobsBody.success, true);
    assert.ok(Array.isArray(jobsBody.data));
  } finally {
    await new Promise((resolve, reject) => {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
