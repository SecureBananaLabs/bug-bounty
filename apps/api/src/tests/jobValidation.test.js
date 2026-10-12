import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server.address().port));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/jobs accepts a valid job payload", async () => {
  const server = createApp().listen(0);
  const port = await listen(server);

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Build a search index",
      description: "Index jobs, proposals and messages.",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_search",
      skills: ["sqlite"],
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.title, "Build a search index");
  assert.deepEqual(payload.data.skills, ["sqlite"]);

  await close(server);
});

test("POST /api/jobs returns a structured 400 instead of a 500 on invalid input", async () => {
  const server = createApp().listen(0);
  const port = await listen(server);

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "abc", budgetMin: -1 }),
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /title/);
  assert.notEqual(payload.message, "Unexpected server error");

  await close(server);
});
