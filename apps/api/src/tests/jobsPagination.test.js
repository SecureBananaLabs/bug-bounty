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

test("GET /api/jobs paginates when limit and offset are supplied", async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = await listen(server);
  const base = `http://127.0.0.1:${port}`;

  for (let index = 0; index < 3; index += 1) {
    await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `Job ${index}`,
        description: "A paginated job listing",
        budgetMin: 10,
        budgetMax: 20,
        categoryId: "cat_1",
        skills: []
      })
    });
  }

  const first = await (await fetch(`${base}/api/jobs?limit=2&offset=0`)).json();
  assert.equal(first.success, true);
  assert.equal(first.data.pagination.limit, 2);
  assert.equal(first.data.pagination.offset, 0);
  assert.ok(first.data.pagination.total >= 3);
  assert.equal(first.data.data.length, 2);

  const second = await (await fetch(`${base}/api/jobs?limit=2&offset=2`)).json();
  assert.equal(second.data.data.length, 1);
  assert.notEqual(second.data.data[0].id, first.data.data[0].id);

  await close(server);
});

test("GET /api/jobs returns the full array without pagination params", async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = await listen(server);

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data));

  await close(server);
});

test("GET /api/jobs rejects malformed pagination params", async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = await listen(server);
  const base = `http://127.0.0.1:${port}`;

  const tooLarge = await fetch(`${base}/api/jobs?limit=101`);
  assert.equal(tooLarge.status, 400);
  const tooLargeBody = await tooLarge.json();
  assert.equal(tooLargeBody.success, false);
  assert.match(tooLargeBody.message, /limit must be an integer between 1 and 100/);

  const negative = await fetch(`${base}/api/jobs?offset=-1`);
  assert.equal(negative.status, 400);
  const negativeBody = await negative.json();
  assert.match(negativeBody.message, /offset must be a non-negative integer/);

  const fractional = await fetch(`${base}/api/jobs?limit=1.5`);
  assert.equal(fractional.status, 400);

  await close(server);
});
